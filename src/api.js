import { supabase, isSupabaseConfigured } from "./supabase";

const IDS_KEY = "kimaru_my_ids_v1";
const LEGACY_BOARD = "kimaru_board_v3";
export const ME_KEY = "kimaru_me_v3";

export { isSupabaseConfigured };

export function getMyIds() {
  try {
    return JSON.parse(localStorage.getItem(IDS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function rememberId(id) {
  const ids = getMyIds();
  if (!ids.includes(id)) localStorage.setItem(IDS_KEY, JSON.stringify([id, ...ids]));
}

export function forgetId(id) {
  localStorage.setItem(IDS_KEY, JSON.stringify(getMyIds().filter((x) => x !== id)));
}

function readLegacyMeetings() {
  try {
    const raw = localStorage.getItem(LEGACY_BOARD);
    if (!raw) return [];
    const board = JSON.parse(raw);
    return Array.isArray(board?.meetings) ? board.meetings : [];
  } catch {
    return [];
  }
}

export async function bootstrapMeetings(inviteId) {
  if (!isSupabaseConfigured) return { meetings: [], inviteMeeting: null, error: "not_configured" };

  const legacy = readLegacyMeetings();
  for (const m of legacy) {
    await upsertMeeting(m);
    rememberId(m.id);
  }
  if (legacy.length) localStorage.removeItem(LEGACY_BOARD);

  const ids = getMyIds();
  const meetings = await fetchMeetingsByIds(ids);

  // 招待リンクは自分の一覧に入れない（その会議画面だけ開ける）
  let inviteMeeting = null;
  if (inviteId) {
    inviteMeeting = meetings.find((m) => m.id === inviteId) || (await fetchMeeting(inviteId));
  }

  return { meetings, inviteMeeting, error: null };
}

export async function fetchMeeting(id) {
  const { data, error } = await supabase.from("meetings").select("payload").eq("id", id).maybeSingle();
  if (error) throw error;
  return data?.payload ?? null;
}

export async function fetchMeetingsByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("meetings").select("id, payload").in("id", ids);
  if (error) throw error;
  const map = new Map((data || []).map((r) => [r.id, r.payload]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export async function upsertMeeting(meeting) {
  const { error } = await supabase.from("meetings").upsert({
    id: meeting.id,
    payload: meeting,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function removeMeeting(id) {
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw error;
  forgetId(id);
}

export function subscribeMeeting(id, onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`meeting:${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "meetings", filter: `id=eq.${id}` },
      (payload) => {
        const row = payload.new;
        if (row?.payload) onChange(row.payload);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
