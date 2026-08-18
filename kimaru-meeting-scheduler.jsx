import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar, Users, Plus, X, Check, Trash2, ChevronLeft, ChevronRight,
  ArrowLeft, Copy, MessageSquare, AlertTriangle,
  Star, Loader2, CircleDot, Link2,
} from "lucide-react";
import {
  ME_KEY,
  isSupabaseConfigured,
  bootstrapMeetings,
  fetchMeeting,
  upsertMeeting,
  removeMeeting,
  subscribeMeeting,
} from "./src/api";

/* ------------------------------------------------------------------ */
/* tokens & styles                                                     */
/* ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Noto+Sans+JP:wght@400;500;700&family=Roboto+Mono:wght@400;500;700&display=swap');

.km {
  --ink:#111A26; --ink2:#4A5B70; --ink3:#8494A8;
  --paper:#E8EDF2; --card:#FFFFFF; --line:#CFD9E4; --line2:#E8EDF3;
  --ok:#0E7C61; --okbg:#DFF0EA;
  --mb:#A96F16; --mbbg:#F8EDD9;
  --ng:#BC4B3B; --ngbg:#F8E4E0;
  --acc:#2846D6; --accbg:#E4E8FC;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Noto Sans JP', system-ui, sans-serif;
  min-height: 100vh;
  font-size: 14px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
.km *, .km *::before, .km *::after { box-sizing: border-box; }
.km h1,.km h2,.km h3 { font-family:'Zen Kaku Gothic New', sans-serif; font-weight:900; letter-spacing:.01em; line-height:1.3; margin:0; }
.km .mono { font-family:'Roboto Mono', monospace; font-variant-numeric: tabular-nums; }
.km .eyebrow { font-family:'Roboto Mono',monospace; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--ink3); font-weight:500; }
.km .muted { color:var(--ink2); }
.km .card { background:var(--card); border:1px solid var(--line); border-radius:14px; }
.km .divide { border-top:1px solid var(--line2); }

.km button { font-family:inherit; }
.km .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; border-radius:10px; padding:9px 14px; font-weight:700; font-size:13.5px; border:1px solid transparent; cursor:pointer; transition:transform .08s ease, background .15s ease, border-color .15s; white-space:nowrap; }
.km .btn:active { transform:translateY(1px); }
.km .btn:focus-visible { outline:2px solid var(--acc); outline-offset:2px; }
.km .btn-primary { background:var(--ink); color:#fff; }
.km .btn-primary:hover { background:#243448; }
.km .btn-ghost { background:#fff; border-color:var(--line); color:var(--ink); }
.km .btn-ghost:hover { border-color:var(--ink3); }
.km .btn-quiet { background:transparent; color:var(--ink2); padding:6px 8px; }
.km .btn-quiet:hover { color:var(--ink); background:#fff; }
.km .btn-sm { padding:6px 10px; font-size:12.5px; border-radius:8px; }
.km .btn[disabled] { opacity:.4; cursor:not-allowed; }

.km input[type=text], .km input[type=date], .km input[type=time], .km input[type=number], .km textarea, .km select {
  font-family:inherit; font-size:14px; color:var(--ink); background:#fff;
  border:1px solid var(--line); border-radius:10px; padding:9px 11px; width:100%;
}
.km input:focus, .km textarea:focus, .km select:focus { outline:2px solid var(--acc); outline-offset:-1px; border-color:var(--acc); }
.km label.fld { display:block; font-size:12px; font-weight:700; color:var(--ink2); margin-bottom:5px; }

.km .pill { display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:3px 10px; font-size:11.5px; font-weight:700; }
.km .pill-open { background:var(--accbg); color:var(--acc); }
.km .pill-fixed { background:var(--okbg); color:var(--ok); }
.km .pill-warn { background:var(--mbbg); color:var(--mb); }

/* ---- 出欠グリッド ---- */
.km .grid-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:14px; background:#fff; }
.km table.grid { border-collapse:separate; border-spacing:0; width:100%; }
.km table.grid th, .km table.grid td { border-bottom:1px solid var(--line2); padding:10px 12px; text-align:center; }
.km table.grid thead th { position:sticky; top:0; background:#fff; z-index:3; font-size:11.5px; font-weight:700; color:var(--ink2); border-bottom:1px solid var(--line); }
.km table.grid .cell-date { position:sticky; left:0; background:#fff; z-index:2; text-align:left; min-width:186px; border-right:1px solid var(--line); }
.km table.grid thead .cell-date { z-index:4; }
.km table.grid tbody tr:hover .cell-date, .km table.grid tbody tr:hover td { background:#FBFCFE; }
.km tr.best .cell-date { background:#F3FAF7; box-shadow: inset 3px 0 0 var(--ok); }
.km tr.best:hover .cell-date { background:#EDF7F3; }
.km .name-v { writing-mode:vertical-rl; text-orientation:mixed; white-space:nowrap; max-height:96px; overflow:hidden; margin:0 auto; }

/* ---- 合意バー（シグネチャー） ---- */
.km .cbar { display:flex; height:7px; border-radius:4px; overflow:hidden; background:#EDF1F5; margin-top:7px; }
.km .cbar i { display:block; height:100%; }
.km .cbar .s-ok { background:var(--ok); }
.km .cbar .s-mb { background:#E3B85A; }
.km .cbar .s-ng { background:var(--ng); }
.km .cbar .s-none { background:#DCE3EB; }

.km .mark { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:9px; font-weight:700; font-size:15px; }
.km .m-ok { background:var(--okbg); color:var(--ok); }
.km .m-mb { background:var(--mbbg); color:var(--mb); }
.km .m-ng { background:var(--ngbg); color:var(--ng); }
.km .m-na { background:#F1F4F8; color:#B6C1CE; }

/* ---- 回答ボタン ---- */
.km .ans { flex:1; border:1px solid var(--line); background:#fff; border-radius:10px; padding:9px 4px; font-weight:700; font-size:13px; color:var(--ink2); cursor:pointer; transition:.12s; }
.km .ans:hover { border-color:var(--ink3); }
.km .ans.on-ok { background:var(--ok); border-color:var(--ok); color:#fff; }
.km .ans.on-mb { background:var(--mb); border-color:var(--mb); color:#fff; }
.km .ans.on-ng { background:var(--ng); border-color:var(--ng); color:#fff; }
.km .ans:focus-visible { outline:2px solid var(--acc); outline-offset:2px; }

/* ---- ミニカレンダー ---- */
.km .cal { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.km .cal button { aspect-ratio:1/1; border:1px solid transparent; background:transparent; border-radius:9px; font-family:'Roboto Mono',monospace; font-size:13px; color:var(--ink); cursor:pointer; }
.km .cal button:hover:not([disabled]) { background:#EFF3F7; }
.km .cal button.sel { background:var(--ink); color:#fff; font-weight:700; }
.km .cal button[disabled] { color:#C4CEDA; cursor:default; }
.km .cal .sat { color:#3F72B8; } .km .cal .sun { color:#B8564A; }
.km .cal button.sel.sat, .km .cal button.sel.sun { color:#fff; }
.km .caldow { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; font-size:10.5px; text-align:center; color:var(--ink3); font-weight:700; margin-bottom:4px; }

.km .chipbtn { border:1px solid var(--line); background:#fff; border-radius:999px; padding:5px 12px; font-size:12.5px; font-weight:700; color:var(--ink2); cursor:pointer; font-family:'Roboto Mono',monospace; }
.km .chipbtn.on { background:var(--ink); color:#fff; border-color:var(--ink); }
.km .chipbtn:hover { border-color:var(--ink3); }

.km .tab { padding:11px 2px; font-weight:700; font-size:14px; color:var(--ink3); background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; }
.km .tab.on { color:var(--ink); border-bottom-color:var(--ink); }

.km .toast { position:fixed; left:50%; transform:translateX(-50%); bottom:22px; background:var(--ink); color:#fff; padding:10px 18px; border-radius:999px; font-size:13px; font-weight:700; z-index:60; box-shadow:0 8px 24px rgba(17,26,38,.28); }
.km .logo-grid { display:grid; grid-template-columns:repeat(3,6px); gap:2px; }
.km .logo-grid i { width:6px; height:6px; border-radius:1.5px; background:#C3CEDA; display:block; }
.km .logo-grid i.f { background:var(--ok); }
.km a.link { color:var(--acc); text-decoration:none; font-weight:700; }
.km a.link:hover { text-decoration:underline; }
.km .ans-mini { width: 28px; height: 28px; border: 1px solid var(--line); background: #fff; border-radius: 8px; font-weight: 700; font-size: 13px; color: var(--ink2); cursor: pointer; padding: 0; }
.km .ans-mini:hover { border-color: var(--ink3); }
.km .ans-mini.on-ok { background: var(--ok); border-color: var(--ok); color: #fff; }
.km .ans-mini.on-mb { background: var(--mb); border-color: var(--mb); color: #fff; }
.km .ans-mini.on-ng { background: var(--ng); border-color: var(--ng); color: #fff; }
.km th.you-col { color: var(--acc) !important; }
.km td.you-col { background: #F7F8FE; }
@media (prefers-reduced-motion: reduce) { .km * { transition:none !important; } }
`;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const WD = ["日", "月", "火", "水", "木", "金", "土"];
const uid = () => Math.random().toString(36).slice(2, 10);
const dObj = (s) => new Date(s + "T00:00:00");
const fmtMD = (s) => { const d = dObj(s); return `${d.getMonth() + 1}/${d.getDate()}`; };
const fmtFull = (s) => { const d = dObj(s); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WD[d.getDay()]})`; };
const dow = (s) => WD[dObj(s).getDay()];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayISO = () => iso(new Date());
const candKey = (c) => `${c.date} ${c.start}`;
const sortCands = (a, b) => (candKey(a) < candKey(b) ? -1 : 1);
const mins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const addMin = (t, n) => { const v = mins(t) + n; return `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`; };
/* 時間は30分単位のみ（1分単位の入力はさせない） */
const TIME_OPTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
const snap30 = (t) => {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return "10:00";
  const [h, m] = t.split(":").map(Number);
  if (m < 15) return `${String(h).padStart(2, "0")}:00`;
  if (m < 45) return `${String(h).padStart(2, "0")}:30`;
  return `${String((h + 1) % 24).padStart(2, "0")}:00`;
};
function TimeSelect({ value, onChange, style }) {
  const v = snap30(value);
  return (
    <select value={v} onChange={(e) => onChange(e.target.value)} style={{ width: 110, ...style }} aria-label="時刻（30分単位）">
      {TIME_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
/** 参加者提案を候補に載せ、提案者にはその枠を ○ で仮回答する */
function absorbProposals(mm, items) {
  const byKey = new Map();
  items.forEach((p) => {
    const start = snap30(p.start);
    const end = snap30(p.end || addMin(start, 60));
    const key = `${p.date}|${start}|${end}`;
    if (!byKey.has(key)) byKey.set(key, { date: p.date, start, end, bys: [] });
    if (p.by && !byKey.get(key).bys.includes(p.by)) byKey.get(key).bys.push(p.by);
  });
  let candidates = [...mm.candidates];
  let responses = { ...mm.responses };
  let added = 0;
  byKey.forEach((g) => {
    if (candidates.some((c) => c.date === g.date && c.start === g.start && c.end === g.end)) return;
    const id = uid();
    candidates.push({ id, date: g.date, start: g.start, end: g.end });
    added++;
    g.bys.forEach((name) => {
      const prev = responses[name];
      if (!prev) return;
      responses[name] = { ...prev, answers: { ...prev.answers, [id]: "ok" } };
    });
  });
  return { next: { ...mm, candidates: candidates.sort(sortCands), responses }, added };
}

const ME_LOCAL = ME_KEY;
const PAST_NAMES_KEY = "kimaru_past_names_v1";

function loadPastNames() {
  try { return JSON.parse(localStorage.getItem(PAST_NAMES_KEY) || "[]"); } catch { return []; }
}
function savePastNames(names) {
  const uniq = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  localStorage.setItem(PAST_NAMES_KEY, JSON.stringify(uniq));
  return uniq;
}
function rememberPastNames(names) {
  return savePastNames([...loadPastNames(), ...names]);
}

const HOSTED_KEY = "kimaru_hosted_ids_v1";
const HOST_TOKENS_KEY = "kimaru_host_tokens_v1";

function loadHostedIds() {
  try { return JSON.parse(localStorage.getItem(HOSTED_KEY) || "[]"); } catch { return []; }
}
function markHosted(id) {
  const ids = loadHostedIds();
  if (!ids.includes(id)) localStorage.setItem(HOSTED_KEY, JSON.stringify([id, ...ids]));
}
function loadHostTokens() {
  try { return JSON.parse(localStorage.getItem(HOST_TOKENS_KEY) || "{}"); } catch { return {}; }
}
function rememberHostToken(id, token) {
  if (!id || !token) return;
  const map = loadHostTokens();
  map[id] = token;
  localStorage.setItem(HOST_TOKENS_KEY, JSON.stringify(map));
  markHosted(id);
}
function checkIsHost(m) {
  if (!m?.id) return false;
  try {
    const urlHost = new URLSearchParams(window.location.search).get("host");
    if (m.hostToken && urlHost && urlHost === m.hostToken) {
      rememberHostToken(m.id, m.hostToken);
      return true;
    }
  } catch { /* noop */ }
  if (m.hostToken && loadHostTokens()[m.id] === m.hostToken) return true;
  if (loadHostedIds().includes(m.id)) return true;
  return false;
}

function inviteUrlFor(id, hostToken) {
  if (typeof window === "undefined") return hostToken ? `?m=${id}&host=${hostToken}` : `?m=${id}`;
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("m", id);
  if (hostToken) url.searchParams.set("host", hostToken);
  return url.toString();
}

/* 集計 */
function tally(m, c) {
  const res = Object.values(m.responses || {});
  let ok = 0, mb = 0, ng = 0;
  const ngNames = [], mbNames = [], okNames = [];
  res.forEach((r) => {
    const a = r.answers?.[c.id];
    if (a === "ok") { ok++; okNames.push(r.name); }
    else if (a === "mb") { mb++; mbNames.push(r.name); }
    else if (a === "ng") { ng++; ngNames.push(r.name); }
  });
  const total = m.participants.length || res.length || 1;
  const required = m.participants.filter((p) => p.required).map((p) => p.name);
  const blocked = required.filter((n) => ngNames.includes(n));
  return { ok, mb, ng, none: Math.max(0, total - ok - mb - ng), total, okNames, mbNames, ngNames, blocked, score: ok * 2 + mb - (blocked.length ? 999 : 0) };
}
const bestOf = (m) => {
  if (!m.candidates.length) return null;
  return [...m.candidates].map((c) => ({ c, t: tally(m, c) })).sort((a, b) => b.t.score - a.t.score || (candKey(a.c) < candKey(b.c) ? -1 : 1))[0];
};

function announceText(m, c) {
  return [
    `【日程確定】${m.title}`,
    `日時: ${fmtFull(c.date)} ${c.start}〜${c.end}`,
    m.purpose ? `議題: ${m.purpose}` : "",
    m.participants.length ? `参加: ${m.participants.map((p) => p.name).join("、")}` : "",
  ].filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ */
/* 小物                                                                */
/* ------------------------------------------------------------------ */
function ConsensusBar({ t }) {
  const w = (n) => `${(n / Math.max(1, t.total)) * 100}%`;
  return (
    <div className="cbar" aria-hidden="true">
      <i className="s-ok" style={{ width: w(t.ok) }} />
      <i className="s-mb" style={{ width: w(t.mb) }} />
      <i className="s-ng" style={{ width: w(t.ng) }} />
      <i className="s-none" style={{ width: w(t.none) }} />
    </div>
  );
}

function MiniCalendar({ selected, onToggle }) {
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const t0 = todayISO();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" className="btn btn-quiet" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))} aria-label="前の月"><ChevronLeft size={16} /></button>
        <div className="mono font-bold text-sm">{cur.getFullYear()}.{String(cur.getMonth() + 1).padStart(2, "0")}</div>
        <button type="button" className="btn btn-quiet" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))} aria-label="次の月"><ChevronRight size={16} /></button>
      </div>
      <div className="caldow">{WD.map((w) => <div key={w}>{w}</div>)}</div>
      <div className="cal">
        {cells.map((d, i) => {
          const s = iso(d);
          const outside = d.getMonth() !== cur.getMonth();
          const past = s < t0;
          const cls = [d.getDay() === 6 ? "sat" : "", d.getDay() === 0 ? "sun" : "", selected.includes(s) ? "sel" : ""].join(" ");
          return (
            <button key={i} type="button" disabled={past || outside} className={cls}
              style={{ opacity: outside ? 0 : 1, pointerEvents: outside ? "none" : "auto" }}
              onClick={() => onToggle(s)} aria-pressed={selected.includes(s)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="fld">{label}</label>
      {children}
      {hint && <div className="text-xs muted mt-1">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* アプリ                                                              */
/* ------------------------------------------------------------------ */
export default function App() {
  const [board, setBoard] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [me, setMe] = useState("");
  const [view, setView] = useState({ name: "home" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(ME_LOCAL);
        if (saved) setMe(JSON.parse(saved));
      } catch { /* noop */ }

      const mid = new URLSearchParams(window.location.search).get("m");
      if (!isSupabaseConfigured) {
        setBoard({ meetings: [] });
        setBootError("not_configured");
        if (mid) setView({ name: "meeting", id: mid, tab: "respond" });
        return;
      }

      try {
        const { meetings, error } = await bootstrapMeetings(mid);
        setBoard({ meetings });
        setBootError(error);
        if (mid) setView({ name: "meeting", id: mid, tab: "respond" });
      } catch (e) {
        console.error(e);
        setBoard({ meetings: [] });
        setBootError(e.message || "load_failed");
      }
    })();
  }, []);

  const say = useCallback((t) => { setToast(t); setTimeout(() => setToast(""), 2200); }, []);
  const saveMe = (n) => {
    setMe(n);
    try { localStorage.setItem(ME_LOCAL, JSON.stringify(n)); } catch { /* noop */ }
  };

  const putMeeting = useCallback((meeting) => {
    setBoard((b) => {
      const list = b?.meetings || [];
      const i = list.findIndex((x) => x.id === meeting.id);
      if (i < 0) return { meetings: [meeting, ...list] };
      const next = [...list];
      next[i] = meeting;
      return { meetings: next };
    });
  }, []);

  const mutate = useCallback(async (id, fn, msg) => {
    try {
      const latest = (await fetchMeeting(id)) || board?.meetings?.find((m) => m.id === id);
      if (!latest) { say("会議が見つかりません"); return null; }
      const updated = fn(latest);
      await upsertMeeting(updated);
      putMeeting(updated);
      if (msg) say(msg);
      return updated;
    } catch (e) {
      console.error(e);
      say("保存に失敗しました");
      return null;
    }
  }, [board, putMeeting, say]);

  const openMeeting = (id, tab = "respond") => {
    const t = ["respond", "result", "setting"].includes(tab) ? tab : "respond";
    setView({ name: "meeting", id, tab: t });
    const url = new URL(window.location.href);
    url.searchParams.set("m", id);
    const hostTok = loadHostTokens()[id];
    if (hostTok) url.searchParams.set("host", hostTok);
    else url.searchParams.delete("host");
    window.history.replaceState({}, "", url);
  };
  const goHome = () => {
    setView({ name: "home" });
    const url = new URL(window.location.href);
    url.searchParams.delete("m");
    url.searchParams.delete("host");
    window.history.replaceState({}, "", url);
  };

  // 開いている会議をリアルタイム同期
  useEffect(() => {
    if (view.name !== "meeting" || !view.id || !isSupabaseConfigured) return undefined;
    return subscribeMeeting(view.id, (payload) => putMeeting(payload));
  }, [view.name, view.id, putMeeting]);

  const meetings = board?.meetings || [];
  const current = view.id ? meetings.find((m) => m.id === view.id) : null;

  if (!board) {
    return (
      <div className="km flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <style>{CSS}</style>
        <div className="muted flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" />読み込んでいます</div>
      </div>
    );
  }

  if (bootError === "not_configured") {
    return (
      <div className="km" style={{ minHeight: "100vh" }}>
        <style>{CSS}</style>
        <main className="mx-auto px-4 py-16" style={{ maxWidth: 560 }}>
          <h1 style={{ fontSize: 28 }} className="mb-3">Supabase の接続が必要です</h1>
          <p className="muted text-sm mb-5">招待リンクを他の人と共有するには、Supabase プロジェクトを接続してください。</p>
          <ol className="grid gap-3 text-sm" style={{ paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Supabase でプロジェクトを作成</li>
            <li><span className="mono">supabase/schema.sql</span> を SQL Editor で実行</li>
            <li>Project Settings → API の URL と anon key をコピー</li>
            <li>プロジェクト直下に <span className="mono">.env</span> を作り、<span className="mono">.env.example</span> を参考に貼る</li>
            <li><span className="mono">npm run dev</span> を再起動</li>
          </ol>
        </main>
      </div>
    );
  }

  return (
    <div className="km">
      <style>{CSS}</style>
      <Header onHome={goHome} />
      <main className="mx-auto px-4 pb-24" style={{ maxWidth: 1020 }}>
        {bootError && bootError !== "not_configured" && (
          <div className="card p-3 mb-4 text-sm" style={{ borderColor: "var(--ng)", color: "var(--ng)", background: "var(--ngbg)" }}>
            データの読み込みに失敗しました: {String(bootError)}
          </div>
        )}
        {view.name === "home" && (
          <Home meetings={meetings}
            onOpen={(id) => openMeeting(id)}
            onNew={() => setView({ name: "new" })} />
        )}
        {view.name === "new" && (
          <NewMeeting
            pastNames={loadPastNames()}
            allMeetings={meetings}
            say={say}
            onCancel={goHome}
            onCreate={async (m) => {
              rememberPastNames(m.participants.map((p) => p.name));
              await upsertMeeting(m);
              putMeeting(m);
              if (m.hostToken) rememberHostToken(m.id, m.hostToken);
              else markHosted(m.id);
              say("調整リンクを発行しました");
              return m;
            }}
            onOpenMeeting={(id) => openMeeting(id, "respond")}
            base={view.copyFrom ? meetings.find((x) => x.id === view.copyFrom) : null} />
        )}
        {view.name === "meeting" && current && (
          <MeetingView m={current} me={me} setMe={saveMe} say={say}
            tab={["respond", "result", "setting"].includes(view.tab) ? view.tab : "respond"}
            setTab={(t) => setView({ ...view, tab: t })}
            onBack={goHome}
            others={meetings.filter((x) => x.id !== current.id)}
            mutate={(fn, msg) => mutate(current.id, fn, msg)}
            onCopy={() => setView({ name: "new", copyFrom: current.id })}
            onDelete={async () => {
              try {
                await removeMeeting(current.id);
                setBoard((b) => ({ meetings: (b?.meetings || []).filter((x) => x.id !== current.id) }));
                say("会議を削除しました");
                goHome();
              } catch (e) {
                console.error(e);
                say("削除に失敗しました");
              }
            }} />
        )}
        {view.name === "meeting" && !current && (
          <div className="muted py-16 text-center">
            この会議は見つかりません。リンクが間違っているか、まだ作成されていない可能性があります。
          </div>
        )}
      </main>
      <footer className="mx-auto px-4 pb-10 text-xs muted" style={{ maxWidth: 1020 }}>
        会議データは Supabase に保存されます。招待リンクを知っている人は同じボードを開けます。
      </footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------------- header ---------------- */
function Header({ onHome }) {
  return (
    <header className="sticky top-0 z-40" style={{ background: "rgba(232,237,242,.88)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line)" }}>
      <div className="mx-auto px-4 py-3 flex items-center gap-3" style={{ maxWidth: 1020 }}>
        <button className="btn btn-quiet" onClick={onHome} style={{ padding: 0 }}>
          <span className="flex items-center gap-2.5">
            <span className="logo-grid"><i /><i className="f" /><i /><i /><i /><i className="f" /></span>
            <span style={{ fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 900, fontSize: 17, letterSpacing: ".02em", color: "var(--ink)" }}>キマル</span>
          </span>
        </button>
        <span className="eyebrow hidden sm:inline">会議調整サポート</span>
      </div>
    </header>
  );
}

/* ---------------- home ---------------- */
function Home({ meetings, onOpen, onNew }) {
  return (
    <div>
      <section className="pt-10 pb-7">
        <div className="eyebrow mb-2">Meeting scheduler</div>
        <h1 style={{ fontSize: 30, letterSpacing: "-.01em" }}>会議調整のサポートツール</h1>
        <p className="muted mt-3" style={{ maxWidth: 560 }}>
          候補日時を並べて、参加者は ○ △ × を選ぶだけ。合意の濃さがバーで見えるので、どこで決まるかが一目でわかります。
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <button className="btn btn-primary" onClick={onNew}><Plus size={15} />会議をつくる</button>
        </div>
      </section>

      <div className="flex items-baseline justify-between mb-3">
        <h2 style={{ fontSize: 15 }}>会議一覧</h2>
        <span className="eyebrow">{meetings.length} meetings</span>
      </div>

      {meetings.length === 0 ? (
        <div className="card p-10 text-center">
          <Calendar size={26} style={{ color: "var(--ink3)", margin: "0 auto 10px" }} />
          <div className="font-bold mb-1">まだ会議がありません</div>
          <p className="muted text-sm mb-4">会議内容・参加者・候補日時を入れて、調整リンクを発行しましょう。</p>
          <button className="btn btn-primary" onClick={onNew}><Plus size={15} />会議をつくる</button>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {meetings.map((m) => <MeetingCard key={m.id} m={m} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ m, onOpen }) {
  const answered = Object.keys(m.responses || {}).length;
  const total = m.participants.length;
  const best = bestOf(m);
  const dec = m.decided ? m.candidates.find((c) => c.id === m.decided.candidateId) : null;
  return (
    <button className="card p-4 text-left" style={{ cursor: "pointer" }} onClick={() => onOpen(m.id)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 style={{ fontSize: 15.5 }}>{m.title}</h3>
        <span className={m.decided ? "pill pill-fixed" : "pill pill-open"}>{m.decided ? "確定" : "回答受付中"}</span>
      </div>
      {m.purpose && <p className="muted text-xs mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.purpose}</p>}
      {dec ? (
        <div className="mono text-sm font-bold mb-2" style={{ color: "var(--ok)" }}>
          {fmtMD(dec.date)}({dow(dec.date)}) {dec.start}–{dec.end}
        </div>
      ) : best ? (
        <div className="mb-2">
          <div className="mono text-sm font-bold">{fmtMD(best.c.date)}({dow(best.c.date)}) {best.c.start}–{best.c.end} <span className="muted" style={{ fontWeight: 500 }}>が最有力</span></div>
          <ConsensusBar t={best.t} />
        </div>
      ) : <div className="muted text-xs mb-2">候補日時が未設定です</div>}
      <div className="flex items-center gap-3 text-xs muted mono pt-2 divide" style={{ marginTop: 10, paddingTop: 8 }}>
        <span className="flex items-center gap-1"><Users size={12} />{answered}/{total}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{m.candidates.length}候補</span>
      </div>
    </button>
  );
}

/* ---------------- new meeting ---------------- */
function NewMeeting({ onCancel, onCreate, onOpenMeeting, pastNames, allMeetings, base, say }) {
  const [roster, setRoster] = useState(() => {
    const stored = [...(pastNames || [])];
    if (stored.length) return [...new Set(stored)].filter(Boolean).sort();
    const fromMeetings = (allMeetings || []).flatMap((m) => (m.participants || []).map((p) => p.name));
    return savePastNames(fromMeetings);
  });

  const [title, setTitle] = useState(base ? base.title + "（コピー）" : "");
  const [purpose, setPurpose] = useState(base?.purpose || "");
  const [names, setNames] = useState(base ? base.participants.map((p) => ({ ...p })) : []);
  const [nameInput, setNameInput] = useState("");
  const [dates, setDates] = useState([]);
  const [slot, setSlot] = useState("");
  const [dur, setDur] = useState(60);
  const [cands, setCands] = useState(base ? base.candidates.map((c) => ({ ...c, id: uid() })) : []);
  const [err, setErr] = useState("");
  const [issued, setIssued] = useState(null);
  const [busy, setBusy] = useState(false);

  const togglePast = (n) => {
    if (names.some((p) => p.name === n)) setNames(names.filter((p) => p.name !== n));
    else setNames([...names, { id: uid(), name: n, required: false }]);
  };
  const removePast = (n, e) => {
    e.stopPropagation();
    const next = savePastNames(roster.filter((x) => x !== n));
    setRoster(next);
    setNames((cur) => cur.filter((p) => p.name !== n));
  };
  const addNames = () => {
    const list = nameInput.split(/[、,\n\s]+/).map((s) => s.trim()).filter(Boolean);
    if (!list.length) return;
    setNames([...names, ...list.filter((n) => !names.some((p) => p.name === n)).map((n) => ({ id: uid(), name: n, required: false }))]);
    setRoster(savePastNames([...roster, ...list]));
    setNameInput("");
  };
  const genCands = () => {
    if (!dates.length || !slot) { setErr("日付と開始時刻をどちらも選んでください。"); return; }
    const made = [];
    dates.forEach((d) => {
      if (!cands.some((c) => c.date === d && c.start === slot)) made.push({ id: uid(), date: d, start: slot, end: addMin(slot, dur) });
    });
    setCands([...cands, ...made].sort(sortCands)); setErr(""); setDates([]);
  };

  const submit = async () => {
    if (!title.trim()) { setErr("会議名を入れてください。"); return; }
    if (!cands.length) { setErr("候補日時を1つ以上つくってください。"); return; }
    setBusy(true); setErr("");
    try {
      const m = {
        id: uid(), title: title.trim(), purpose: purpose.trim(), organizer: "",
        deadline: "", participants: names, candidates: [...cands].sort(sortCands),
        responses: {}, decided: null, meetingUrl: "", createdAt: Date.now(),
        hostToken: uid() + uid(),
      };
      await onCreate(m);
      setIssued({ id: m.id, title: m.title, hostToken: m.hostToken });
    } catch (e) {
      console.error(e);
      setErr("発行に失敗しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  if (issued) {
    const url = inviteUrlFor(issued.id);
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        say?.("調整リンクをコピーしました。参加者に手動で送ってください");
      } catch { say?.("コピーできませんでした"); }
    };
    return (
      <div className="py-7">
        <h1 style={{ fontSize: 24 }} className="mb-2">調整リンクを発行しました</h1>
        <p className="muted text-sm mb-5">このリンクを参加者へ手動で送付してください。</p>
        <div className="card p-5 mb-4" style={{ borderColor: "var(--acc)", background: "var(--accbg)" }}>
          <div className="font-bold mb-2">{issued.title}</div>
          <code className="mono text-xs block mb-3" style={{ wordBreak: "break-all" }}>{url}</code>
          <button className="btn btn-primary" onClick={copy}><Copy size={15} />調整リンクをコピー</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => onOpenMeeting(issued.id)}>会議ボードを開く</button>
          <button className="btn btn-quiet" onClick={onCancel}>一覧へ戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-7">
      <button className="btn btn-quiet mb-3" onClick={onCancel}><ArrowLeft size={15} />会議一覧へ戻る</button>
      <h1 style={{ fontSize: 24 }} className="mb-6">調整リンクを発行する</h1>

      <div className="card p-5 mb-4">
        <div className="eyebrow mb-4">STEP1：会議の内容を記載してください</div>
        <div className="grid gap-4">
          <Field label="会議名"><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例）Q3 販売戦略レビュー" /></Field>
          <Field label="議題・目的" hint="参加者が準備できるように、決めたいことを書いておくと回答が早くなります。">
            <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例）新価格の適用時期と、営業への展開方法を決める" />
          </Field>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="eyebrow mb-4">STEP2：参加予定者を選択してください</div>
        {roster.length > 0 && (
          <div className="mb-4">
            <div className="fld">前回までの参加者から選ぶ</div>
            <div className="flex flex-wrap gap-2">
              {roster.map((n) => (
                <span key={n} className={`chipbtn ${names.some((p) => p.name === n) ? "on" : ""}`}
                  style={{ fontFamily: "'Noto Sans JP',sans-serif", display: "inline-flex", alignItems: "center", gap: 6, paddingRight: 6 }}>
                  <button type="button" onClick={() => togglePast(n)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", font: "inherit", fontWeight: 700 }}>
                    {n}
                  </button>
                  <button type="button" onClick={(e) => removePast(n, e)} aria-label={`${n}を履歴から削除`}
                    title="履歴から削除"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex", opacity: 0.7 }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="text-xs muted mt-2">× で履歴から削除できます（この会議の参加者リストとは別です）</div>
          </div>
        )}
        <div className="flex gap-2 mb-3">
          <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNames(); } }}
            placeholder="新しい名前を入力（カンマ・改行でまとめて追加できます）" />
          <button className="btn btn-ghost" onClick={addNames}><Plus size={15} />追加</button>
        </div>
        {names.length === 0 ? <div className="muted text-xs">まだ誰も入っていません。あとから追加もできます。</div> : (
          <div className="flex flex-wrap gap-2">
            {names.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold"
                style={{ background: p.required ? "var(--okbg)" : "#F1F4F8", color: p.required ? "var(--ok)" : "var(--ink2)", borderRadius: 999 }}>
                <button title="必須参加者に切り替える" onClick={() => setNames(names.map((x) => x.id === p.id ? { ...x, required: !x.required } : x))}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", display: "flex" }}>
                  <Star size={12} fill={p.required ? "currentColor" : "none"} />
                </button>
                {p.name}
                <button onClick={() => setNames(names.filter((x) => x.id !== p.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", display: "flex" }} aria-label={`${p.name}を外す`}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="text-xs muted mt-3">★ を押すと必須参加者になります。必須の人が × を出した候補は、集計で「要調整」として下げます。</div>
      </div>

      <div className="card p-5 mb-4">
        <div className="eyebrow mb-4">STEP3：候補日時を設定してください</div>
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          <div>
            <label className="fld">日付を選ぶ（複数可）</label>
            <MiniCalendar selected={dates} onToggle={(s) => setDates(dates.includes(s) ? dates.filter((x) => x !== s) : [...dates, s].sort())} />
          </div>
          <div>
            <label className="fld">開始時刻を選ぶ（1つ）</label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {SLOTS.map((s) => (
                <button key={s} type="button" className={`chipbtn ${slot === s ? "on" : ""}`}
                  onClick={() => setSlot(slot === s ? "" : s)}>{s}</button>
              ))}
            </div>
            <Field label="所要時間">
              <select value={dur} onChange={(e) => setDur(Number(e.target.value))}>
                {[30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n}分</option>)}
              </select>
            </Field>
            <button className="btn btn-primary w-full mt-4" onClick={genCands}>
              <Plus size={15} />{dates.length && slot ? `${dates.length}件の候補をつくる` : "候補をつくる"}
            </button>
          </div>
        </div>
        {cands.length > 0 && (
          <div className="mt-5 pt-4 divide">
            <div className="flex items-center justify-between mb-2">
              <span className="fld" style={{ margin: 0 }}>候補一覧（{cands.length}件）</span>
              <button className="btn btn-quiet btn-sm" onClick={() => setCands([])}>すべて消す</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cands.map((c) => (
                <span key={c.id} className="mono flex items-center gap-2 px-2.5 py-1.5 text-xs" style={{ background: "#F1F4F8", borderRadius: 8 }}>
                  {fmtMD(c.date)}({dow(c.date)}) {c.start}–{c.end}
                  <button onClick={() => setCands(cands.filter((x) => x.id !== c.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--ink3)" }} aria-label="この候補を消す"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {err && <div className="card p-3 mb-4 text-sm font-bold" style={{ borderColor: "var(--ng)", color: "var(--ng)", background: "var(--ngbg)" }}>{err}</div>}
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
          この内容で調整リンクを発行する
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>やめる</button>
      </div>
      <p className="text-xs muted mt-3">発行後にリンクが表示されます。参加者へ手動で送付してください。</p>
    </div>
  );
}

/* ---------------- meeting view ---------------- */
function MeetingView({ m, me, setMe, tab, setTab, onBack, mutate, onDelete, onCopy, say, others }) {
  const [host, setHost] = useState(() => checkIsHost(m));
  const [claiming, setClaiming] = useState(false);
  const dec = m.decided ? m.candidates.find((c) => c.id === m.decided.candidateId) : null;
  const hostTabs = [["respond", "回答"], ["result", "集計・確定"], ["setting", "設定"]];
  const safeTab = host ? (hostTabs.some(([k]) => k === tab) ? tab : "respond") : "respond";

  useEffect(() => {
    setHost(checkIsHost(m));
  }, [m.id, m.hostToken]);

  const enableHostMenu = async () => {
    if (checkIsHost(m)) { setHost(true); return; }
    if (m.hostToken) {
      say("この端末は主催者として登録されていません。発行したブラウザで開くか、新しい会議を発行してください。");
      return;
    }
    setClaiming(true);
    try {
      const token = uid() + uid();
      const updated = await mutate((mm) => ({ ...mm, hostToken: token }), "主催者メニューを表示しました");
      if (updated) {
        rememberHostToken(m.id, token);
        setHost(true);
        const url = new URL(window.location.href);
        url.searchParams.set("host", token);
        window.history.replaceState({}, "", url);
        setTab("result");
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="py-7">
      <button className="btn btn-quiet mb-3" onClick={onBack}><ArrowLeft size={15} />会議一覧へ戻る</button>
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>{m.title}</h1>
          <div className="muted text-xs mt-1 mono">
            参加予定 {m.participants.length}名 ・ 回答 {Object.keys(m.responses || {}).length}名
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!host && (
            <button className="btn btn-ghost btn-sm" onClick={enableHostMenu} disabled={claiming}>
              {claiming ? <Loader2 size={13} className="animate-spin" /> : null}
              主催者メニューを表示
            </button>
          )}
          <span className={m.decided ? "pill pill-fixed" : "pill pill-open"}>{m.decided ? "日程確定" : "回答受付中"}</span>
        </div>
      </div>
      {m.purpose && <p className="muted mt-3 text-sm" style={{ maxWidth: 640 }}>{m.purpose}</p>}

      {dec && (
        <div className="card p-4 mt-4" style={{ borderColor: "var(--ok)", background: "var(--okbg)" }}>
          <div className="eyebrow" style={{ color: "var(--ok)" }}>Fixed</div>
          <div className="mono font-bold mt-1" style={{ fontSize: 20, color: "var(--ok)" }}>{fmtFull(dec.date)} {dec.start}–{dec.end}</div>
        </div>
      )}

      {host && (
        <div className="flex gap-5 mt-5 mb-5" style={{ borderBottom: "1px solid var(--line)" }}>
          {hostTabs.map(([k, label]) => (
            <button key={k} className={`tab ${safeTab === k ? "on" : ""}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
      )}
      {!host && <div className="mt-5 mb-5" />}

      {safeTab === "respond" && <Respond m={m} me={me} setMe={setMe} mutate={mutate} say={say} />}
      {host && safeTab === "result" && <Result m={m} mutate={mutate} say={say} others={others} />}
      {host && safeTab === "setting" && <Setting m={m} mutate={mutate} onDelete={onDelete} onCopy={onCopy} />}
    </div>
  );
}

/* ---------------- 出欠入力 ---------------- */
function Respond({ m, me, setMe, mutate, say }) {
  const [who, setWho] = useState(me || "");
  const [newName, setNewName] = useState("");
  const existing = m.responses?.[who];
  const [answers, setAnswers] = useState({});
  const [props, setProps] = useState([]);

  useEffect(() => {
    setAnswers(existing?.answers || {});
    setProps(existing?.proposals || []);
  }, [who, m.id]); // eslint-disable-line

  // 他の人の回答が更新されたとき、自分以外は最新を見る（自分の編集中 answers は保持）
  const cands = [...m.candidates].sort(sortCands);
  const columns = useMemo(() => {
    const names = [...m.participants.map((p) => p.name)];
    Object.keys(m.responses || {}).forEach((n) => { if (!names.includes(n)) names.push(n); });
    if (who && !names.includes(who)) names.push(who);
    return names;
  }, [m.participants, m.responses, who]);

  const allNg = cands.length > 0 && cands.every((c) => answers[c.id] === "ng");
  const done = cands.filter((c) => answers[c.id]).length;

  const setAnswer = (cid, v) => setAnswers((a) => ({ ...a, [cid]: v }));

  const save = async () => {
    if (!who) { say("名前を選んでください"); return; }
    if (!Object.keys(answers).length) { say("1つ以上の候補に回答してください"); return; }
    rememberPastNames([who]);
    await mutate((mm) => ({
      ...mm,
      participants: mm.participants.some((p) => p.name === who) ? mm.participants : [...mm.participants, { id: uid(), name: who, required: false }],
      responses: {
        ...mm.responses,
        [who]: {
          name: who,
          answers,
          comment: "",
          proposals: props.filter((p) => p.date && p.start).map((p) => ({
            date: p.date, start: snap30(p.start), end: snap30(p.end || addMin(p.start, 60)),
          })),
          updatedAt: Date.now(),
        },
      },
    }), "回答を保存しました");
    setMe(who);
  };

  return (
    <div className="grid gap-4">
      <div className="card p-4">
        <div className="eyebrow mb-3">STEP1：名前を選択してください</div>
        <div className="flex flex-wrap gap-2">
          {m.participants.map((p) => (
            <button key={p.id} className={`chipbtn ${who === p.name ? "on" : ""}`} style={{ fontFamily: "'Noto Sans JP',sans-serif" }} onClick={() => setWho(p.name)}>
              {p.name}{m.responses?.[p.name] ? " ✓" : ""}
            </button>
          ))}
          <span className="flex gap-1.5">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="リストにない場合" style={{ width: 150, padding: "5px 10px", borderRadius: 999 }}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { setWho(newName.trim()); setNewName(""); } }} />
            <button className="btn btn-ghost btn-sm" onClick={() => { if (newName.trim()) { setWho(newName.trim()); setNewName(""); } }}>この名前で回答</button>
          </span>
        </div>
      </div>

      {who && (
        <>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow" style={{ margin: 0 }}>STEP2：候補日時から参加可否を回答してください（{done}/{cands.length}）</div>
              <span className="text-xs muted">全員の状況を見ながら、自分の列を埋めてください</span>
            </div>
            {!cands.length ? (
              <div className="muted text-sm">候補日時がありません。</div>
            ) : (
              <div className="grid-wrap">
                <table className="grid">
                  <thead>
                    <tr>
                      <th className="cell-date" style={{ textAlign: "left" }}>候補日時</th>
                      {columns.map((name) => (
                        <th key={name} className={name === who ? "you-col" : ""} style={{ minWidth: name === who ? 110 : 46 }}>
                          <span className="name-v">{name === who ? `${name}（あなた）` : name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cands.map((c) => (
                      <tr key={c.id}>
                        <td className="cell-date">
                          <div className="mono text-sm font-bold">{fmtMD(c.date)}({dow(c.date)}) {c.start}–{c.end}</div>
                          <ConsensusBar t={tally({ ...m, responses: { ...m.responses, [who]: { name: who, answers } } }, c)} />
                        </td>
                        {columns.map((name) => {
                          if (name === who) {
                            return (
                              <td key={name} className="you-col">
                                <div className="flex gap-1 justify-center">
                                  {[["ok", "○"], ["mb", "△"], ["ng", "×"]].map(([v, label]) => (
                                    <button key={v} type="button" className={`ans-mini ${answers[c.id] === v ? "on-" + v : ""}`}
                                      onClick={() => setAnswer(c.id, v)} aria-label={label}>{label}</button>
                                  ))}
                                </div>
                              </td>
                            );
                          }
                          const a = m.responses?.[name]?.answers?.[c.id];
                          const cls = a === "ok" ? "m-ok" : a === "mb" ? "m-mb" : a === "ng" ? "m-ng" : "m-na";
                          return <td key={name}><span className={`mark ${cls}`}>{a === "ok" ? "○" : a === "mb" ? "△" : a === "ng" ? "×" : "–"}</span></td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="eyebrow mb-2">STEP3：候補日時すべてNGの場合、調整可能な日時候補をご共有ください</div>
            <p className="text-xs muted mb-3">任意・3件まで。時刻は30分単位です。{allNg ? " すべての候補が不可になっています。" : ""}</p>
            <div className="grid gap-2">
              {props.map((p, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center">
                  <input type="date" value={p.date} min={todayISO()} style={{ width: 160 }} onChange={(e) => setProps(props.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
                  <TimeSelect value={p.start} onChange={(start) => setProps(props.map((x, j) => j === i ? { ...x, start, end: addMin(start, 60) } : x))} />
                  <span className="muted">–</span>
                  <TimeSelect value={p.end} onChange={(end) => setProps(props.map((x, j) => j === i ? { ...x, end } : x))} />
                  <button className="btn btn-quiet btn-sm" onClick={() => setProps(props.filter((_, j) => j !== i))}><X size={13} /></button>
                </div>
              ))}
              {props.length < 3 && (
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}
                  onClick={() => setProps([...props, { date: "", start: "10:00", end: "11:00" }])}><Plus size={13} />調整可能な日時を足す</button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save}><Check size={15} />回答を保存する</button>
            {existing && <button className="btn btn-ghost" onClick={() => mutate((mm) => { const r = { ...mm.responses }; delete r[who]; return { ...mm, responses: r }; }, "回答を取り消しました")}>回答を取り消す</button>}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- 集計・確定 ---------------- */
function Result({ m, mutate, say, others }) {
  const [order, setOrder] = useState("score");
  const [pick, setPick] = useState(m.decided?.candidateId || bestOf(m)?.c.id || "");
  const responders = Object.values(m.responses || {}).sort((a, b) => a.updatedAt - b.updatedAt);
  const rows = useMemo(() => {
    const list = m.candidates.map((c) => ({ c, t: tally(m, c) }));
    return order === "score" ? list.sort((a, b) => b.t.score - a.t.score || (candKey(a.c) < candKey(b.c) ? -1 : 1)) : list.sort((a, b) => (candKey(a.c) < candKey(b.c) ? -1 : 1));
  }, [m, order]);
  const best = rows.length ? [...rows].sort((a, b) => b.t.score - a.t.score)[0] : null;
  const noAnswer = m.participants.filter((p) => !m.responses?.[p.name]);
  const proposals = Object.values(m.responses || {}).flatMap((r) => (r.proposals || []).map((p) => ({ ...p, by: r.name, start: snap30(p.start), end: snap30(p.end || addMin(p.start, 60)) })));
  const pendingProps = proposals.filter((p) => !m.candidates.some((c) => c.date === p.date && c.start === p.start && c.end === p.end));
  const pendingUnique = new Set(pendingProps.map((p) => `${p.date}|${p.start}|${p.end}`)).size;
  const weak = best && (best.t.blocked.length > 0 || best.t.ok < Math.ceil((best.t.total || 1) * 0.5));
  const cand = m.candidates.find((c) => c.id === pick) || best?.c || null;
  const text = cand ? announceText(m, cand) : "";

  useEffect(() => {
    if (m.decided?.candidateId) setPick(m.decided.candidateId);
    else if (best?.c?.id && !pick) setPick(best.c.id);
  }, [m.decided?.candidateId, best?.c?.id]); // eslint-disable-line

  const overlap = useMemo(() => {
    if (!cand) return [];
    return others.filter((o) => {
      if (!o.decided) return false;
      const c = o.candidates.find((x) => x.id === o.decided.candidateId);
      if (!c || c.date !== cand.date) return false;
      const shared = o.participants.some((p) => m.participants.some((q) => q.name === p.name));
      return shared && mins(cand.start) < mins(c.end) && mins(c.start) < mins(cand.end);
    }).map((o) => o.title);
  }, [pick, others, m, cand]); // eslint-disable-line

  const copyText = async () => {
    try { await navigator.clipboard.writeText(text); say("確定連絡文をコピーしました"); }
    catch { say("コピーできませんでした"); }
  };

  if (!m.candidates.length) return <div className="card p-8 text-center muted">候補日時がありません。設定タブで追加してください。</div>;

  return (
    <div className="grid gap-4">
      {best && (
        <div className="card p-5">
          <div className="eyebrow mb-1">{best.t.blocked.length ? "現時点の最有力（要調整）" : "現時点の最有力"}</div>
          <div className="mono font-bold" style={{ fontSize: 22 }}>{fmtFull(best.c.date)} {best.c.start}–{best.c.end}</div>
          <div className="text-sm mt-1">
            <b style={{ color: "var(--ok)" }}>○ {best.t.ok}</b>
            <span className="muted"> ・ △ {best.t.mb} ・ × {best.t.ng} ・ 未回答 {best.t.none}</span>
          </div>
          {best.t.blocked.length > 0 && (
            <div className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--ng)" }}>
              <AlertTriangle size={12} />必須参加者（{best.t.blocked.join("、")}）が参加できません
            </div>
          )}
          <div style={{ maxWidth: 420 }} className="mt-2"><ConsensusBar t={best.t} /></div>
        </div>
      )}

      {weak && !m.decided && (
        <div className="card p-4" style={{ borderColor: "var(--mb)", background: "var(--mbbg)" }}>
          <div className="flex items-start gap-2" style={{ color: "var(--mb)" }}>
            <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div className="font-bold text-sm">主催者の候補だけでは決まりにくそうです</div>
              <p className="text-xs mt-1" style={{ color: "var(--ink2)" }}>
                回答タブで代替日時を提案してもらい、下の追加候補から候補に載せると再集計できます。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button className={`chipbtn ${order === "score" ? "on" : ""}`} style={{ fontFamily: "'Noto Sans JP',sans-serif" }} onClick={() => setOrder("score")}>出席が多い順</button>
          <button className={`chipbtn ${order === "date" ? "on" : ""}`} style={{ fontFamily: "'Noto Sans JP',sans-serif" }} onClick={() => setOrder("date")}>日時順</button>
        </div>
        <span className="eyebrow">{responders.length} responses</span>
      </div>

      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th className="cell-date" style={{ textAlign: "left" }}>候補日時</th>
              <th style={{ minWidth: 74 }}>○ / △ / ×</th>
              {responders.map((r) => <th key={r.name} style={{ minWidth: 46 }}><span className="name-v">{r.name}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, t }) => (
              <tr key={c.id} className={best && c.id === best.c.id ? "best" : ""}>
                <td className="cell-date">
                  <div className="mono text-sm font-bold">{fmtMD(c.date)}({dow(c.date)}) {c.start}–{c.end}</div>
                  <ConsensusBar t={t} />
                  {t.blocked.length > 0 && <div className="text-xs mt-1" style={{ color: "var(--ng)" }}>要調整: {t.blocked.join("、")}</div>}
                </td>
                <td className="mono text-xs">
                  <b style={{ color: "var(--ok)" }}>{t.ok}</b> / <span style={{ color: "var(--mb)" }}>{t.mb}</span> / <span style={{ color: "var(--ng)" }}>{t.ng}</span>
                </td>
                {responders.map((r) => {
                  const a = r.answers?.[c.id];
                  const cls = a === "ok" ? "m-ok" : a === "mb" ? "m-mb" : a === "ng" ? "m-ng" : "m-na";
                  return <td key={r.name}><span className={`mark ${cls}`}>{a === "ok" ? "○" : a === "mb" ? "△" : a === "ng" ? "×" : "–"}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {noAnswer.length > 0 && (
        <div className="card p-4">
          <div className="fld">未回答（{noAnswer.length}名）</div>
          <div className="flex flex-wrap gap-1.5">
            {noAnswer.map((p) => <span key={p.id} className="text-xs px-2.5 py-1" style={{ background: "#F1F4F8", borderRadius: 999, color: "var(--ink2)" }}>{p.name}{p.required ? " ★" : ""}</span>)}
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="fld" style={{ margin: 0 }}>参加者からの追加候補（{proposals.length}件）</div>
          {pendingProps.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => mutate((mm) => absorbProposals(mm, pendingProps).next,
                pendingUnique === 1
                  ? "候補に追加しました。表で再集計できます"
                  : `${pendingUnique}件を候補に追加しました`)}
            >
              <Plus size={13} />未追加をすべて候補にして再集計（{pendingUnique}）
            </button>
          )}
        </div>
        <p className="text-xs muted mb-3">候補に載せると集計表に行が増えます。提案者には自動で ○ が入ります。</p>
        {proposals.length === 0 ? (
          <div className="text-sm muted">まだ提案はありません。</div>
        ) : (
          <div className="grid gap-2">
            {proposals.map((p, i) => {
              const dup = m.candidates.some((c) => c.date === p.date && c.start === p.start && c.end === p.end);
              return (
                <div key={i} className="flex flex-wrap items-center gap-2 justify-between py-1.5" style={{ borderTop: i ? "1px solid var(--line2)" : "none" }}>
                  <span className="mono text-sm">{fmtMD(p.date)}({dow(p.date)}) {p.start}–{p.end} <span className="muted" style={{ fontFamily: "'Noto Sans JP',sans-serif" }}>／ {p.by} さん</span></span>
                  <button className="btn btn-ghost btn-sm" disabled={dup}
                    onClick={() => mutate((mm) => absorbProposals(mm, [p]).next, "候補に追加しました")}>
                    {dup ? "追加済み" : <><Plus size={13} />候補に追加</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {responders.some((r) => r.comment) && (
        <div className="card p-4">
          <div className="fld flex items-center gap-1"><MessageSquare size={12} />コメント</div>
          <div className="grid gap-3">
            {responders.filter((r) => r.comment).map((r) => (
              <div key={r.name} className="text-sm">
                <div className="text-xs font-bold muted">{r.name}</div>
                <div>{r.comment}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="eyebrow mb-3">日時を選んで確定する</div>
        <div className="grid gap-1.5">
          {[...m.candidates].sort(sortCands).map((c) => {
            const tt = tally(m, c);
            const on = pick === c.id;
            return (
              <button key={c.id} onClick={() => setPick(c.id)}
                className="flex flex-wrap items-center gap-3 p-3 text-left"
                style={{ border: `1px solid ${on ? "var(--ink)" : "var(--line)"}`, borderRadius: 12, background: on ? "#F7F9FB" : "#fff", cursor: "pointer" }}>
                <CircleDot size={16} style={{ color: on ? "var(--ink)" : "var(--line)" }} />
                <span className="mono font-bold text-sm">{fmtMD(c.date)}({dow(c.date)}) {c.start}–{c.end}</span>
                <span className="text-xs muted mono">○{tt.ok} △{tt.mb} ×{tt.ng}</span>
                <span style={{ flex: 1, minWidth: 90, maxWidth: 200 }}><ConsensusBar t={tt} /></span>
                {tt.blocked.length > 0 && <span className="pill pill-warn">要調整</span>}
              </button>
            );
          })}
        </div>
        {overlap.length > 0 && (
          <div className="mt-3 p-3 text-sm flex items-start gap-2" style={{ background: "var(--mbbg)", color: "var(--mb)", borderRadius: 10 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>この時間は、同じメンバーがいる「{overlap.join("」「")}」と重なっています。</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn btn-primary" disabled={!cand}
            onClick={() => mutate((mm) => ({ ...mm, decided: { candidateId: pick || cand.id, at: Date.now() } }), "日程を確定しました")}>
            <Check size={15} />この日時で確定する
          </button>
          {m.decided && <button className="btn btn-ghost" onClick={() => mutate((mm) => ({ ...mm, decided: null }), "確定を取り消しました")}>確定を取り消す</button>}
        </div>
      </div>

      {cand && (
        <div className="card p-5">
          <div className="eyebrow mb-3">確定連絡文</div>
          <pre className="p-3 text-xs" style={{ background: "#F5F8FA", borderRadius: 10, whiteSpace: "pre-wrap", fontFamily: "'Noto Sans JP',sans-serif", lineHeight: 1.8 }}>
            {text}
          </pre>
          <button className="btn btn-primary mt-3" onClick={copyText}><Copy size={15} />テキストをコピー</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- 設定 ---------------- */
function Setting({ m, mutate, onDelete, onCopy }) {
  const [title, setTitle] = useState(m.title);
  const [purpose, setPurpose] = useState(m.purpose);
  const [nameInput, setNameInput] = useState("");
  const [nd, setNd] = useState(todayISO());
  const [ns, setNs] = useState("10:00");
  const [ne, setNe] = useState("11:00");
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="card p-5">
        <div className="eyebrow mb-3">会議の内容</div>
        <div className="grid gap-3">
          <Field label="会議名"><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="議題・目的"><textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
          <button className="btn btn-primary" style={{ justifySelf: "flex-start" }}
            onClick={() => mutate((mm) => ({ ...mm, title: title.trim() || mm.title, purpose: purpose.trim() }), "内容を更新しました")}>変更を保存</button>
        </div>
      </div>

      <div className="card p-5">
        <div className="eyebrow mb-3">参加予定者</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {m.participants.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold"
              style={{ background: p.required ? "var(--okbg)" : "#F1F4F8", color: p.required ? "var(--ok)" : "var(--ink2)", borderRadius: 999 }}>
              <button title="必須参加者に切り替える" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex" }}
                onClick={() => mutate((mm) => ({ ...mm, participants: mm.participants.map((x) => x.id === p.id ? { ...x, required: !x.required } : x) }))}>
                <Star size={12} fill={p.required ? "currentColor" : "none"} />
              </button>
              {p.name}
              <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex" }} aria-label={`${p.name}を外す`}
                onClick={() => mutate((mm) => ({ ...mm, participants: mm.participants.filter((x) => x.id !== p.id) }), "参加者を外しました")}><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="名前を追加（カンマ区切り可）" />
          <button className="btn btn-ghost" onClick={() => {
            const list = nameInput.split(/[、,\n\s]+/).map((s) => s.trim()).filter(Boolean);
            if (!list.length) return;
            mutate((mm) => ({ ...mm, participants: [...mm.participants, ...list.filter((n) => !mm.participants.some((p) => p.name === n)).map((n) => ({ id: uid(), name: n, required: false }))] }), "参加者を追加しました");
            setNameInput("");
          }}><Plus size={15} />追加</button>
        </div>
      </div>

      <div className="card p-5">
        <div className="eyebrow mb-3">候補日時</div>
        <div className="grid gap-1.5 mb-4">
          {[...m.candidates].sort(sortCands).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: "1px solid var(--line2)" }}>
              <span className="mono text-sm">{fmtMD(c.date)}({dow(c.date)}) {c.start}–{c.end}</span>
              <button className="btn btn-quiet btn-sm" aria-label="この候補を消す"
                onClick={() => mutate((mm) => ({
                  ...mm, candidates: mm.candidates.filter((x) => x.id !== c.id),
                  decided: mm.decided?.candidateId === c.id ? null : mm.decided,
                }), "候補を削除しました")}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <input type="date" value={nd} min={todayISO()} onChange={(e) => setNd(e.target.value)} style={{ width: 160 }} />
          <TimeSelect value={ns} onChange={(v) => { setNs(v); setNe(addMin(v, 60)); }} />
          <span className="muted">–</span>
          <TimeSelect value={ne} onChange={setNe} />
          <button className="btn btn-ghost" onClick={() => mutate((mm) => ({ ...mm, candidates: [...mm.candidates, { id: uid(), date: nd, start: snap30(ns), end: snap30(ne) }].sort(sortCands) }), "候補を追加しました")}>
            <Plus size={15} />候補を追加
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="eyebrow mb-3">この会議を</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={onCopy}><Copy size={15} />同じ設定で複製する</button>
          {confirmDel ? (
            <span className="flex gap-2 items-center">
              <span className="text-sm font-bold" style={{ color: "var(--ng)" }}>回答も消えます。削除しますか？</span>
              <button className="btn btn-sm" style={{ background: "var(--ng)", color: "#fff" }} onClick={onDelete}>削除する</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(false)}>やめる</button>
            </span>
          ) : (
            <button className="btn btn-ghost" style={{ color: "var(--ng)" }} onClick={() => setConfirmDel(true)}><Trash2 size={15} />削除する</button>
          )}
        </div>
      </div>
    </div>
  );
}
