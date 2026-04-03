// ─── components/pages/AIGeneratorPage.jsx ────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { aiAPI } from "../../api/services.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useDocumentTitle } from "../../hooks/index.js";

const LETTERS = ["A", "B", "C", "D"];

const DIFFICULTY_OPTIONS = [
  { id: "easy",   label: "Easy",   icon: "🟢", color: "#22D3A5", glow: "rgba(34,211,165,0.3)",  desc: "Fundamentals" },
  { id: "medium", label: "Medium", icon: "🟡", color: "#FFB347", glow: "rgba(255,179,71,0.3)",  desc: "Applied"      },
  { id: "hard",   label: "Hard",   icon: "🔴", color: "#FF6B6B", glow: "rgba(255,107,107,0.3)", desc: "Advanced"     },
];

const COUNT_OPTIONS = [3, 5, 8, 10];

const SUGGESTED_TOPICS = [
  "React Hooks", "Binary Trees", "CSS Grid", "Machine Learning",
  "SQL Joins", "Recursion", "REST APIs", "Docker",
  "TypeScript", "Graph Algorithms", "JWT Auth", "MongoDB",
];

const LOADING_MSGS = [
  "🤖 Waking up the AI...",
  "🧠 Thinking hard...",
  "✍️  Crafting questions...",
  "🔍 Checking answers...",
  "✨ Almost ready...",
];

// ── Animated number counter ───────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    if (start === value) { setDisplay(value); return; }
    const step = Math.max(1, Math.ceil(value / 20));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{displayed}{!done && <span style={{ borderRight: "2px solid var(--violet-light)", animation: "aig-blink 1s step-end infinite" }}>&nbsp;</span>}</span>;
}

export default function AIGeneratorPage() {
  useDocumentTitle("AI Question Generator");
  const navigate      = useNavigate();
  const { addToast }  = useToast();
  const inputRef      = useRef(null);

  const [topic,      setTopic]      = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count,      setCount]      = useState(5);
  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [attempts,   setAttempts]   = useState({});
  const [phase,      setPhase]      = useState("idle"); // idle | loading | results
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);

  // cycle loading messages
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]); }, 1800);
    return () => clearInterval(iv);
  }, [loading]);

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) { inputRef.current?.focus(); addToast("Please enter a topic first", "error"); return; }
    setLoading(true); setPhase("loading"); setQuestions([]); setAttempts({});
    try {
      const res = await aiAPI.generateQuestions({ topic: trimmed, difficulty, count });
      const qs = res?.questions || [];
      setQuestions(qs); setPhase("results");
      if (!qs.length) addToast("No questions returned — try again", "error");
      else addToast(`✨ ${qs.length} questions ready!`, "success");
    } catch (err) {
      addToast("Generation failed — " + (err.response?.data?.error || err.message), "error");
      setPhase("idle");
    } finally { setLoading(false); }
  };

  const handleSelect = (qIdx, optIdx) => {
    if (attempts[qIdx]?.revealed) return;
    setAttempts((p) => ({ ...p, [qIdx]: { selected: optIdx, revealed: false } }));
  };

  const handleReveal = (qIdx) => {
    setAttempts((p) => ({ ...p, [qIdx]: { ...p[qIdx], revealed: true } }));
  };

  const revealedCount = Object.values(attempts).filter((a) => a.revealed).length;
  const correctCount  = questions.filter((q, i) => { const a = attempts[i]; return a?.revealed && a.selected === q.correctAnswer; }).length;
  const diffMeta      = DIFFICULTY_OPTIONS.find((d) => d.id === difficulty);

  return (
    <>
      {/* ── All keyframes in one block ── */}
      <style>{`
        @keyframes aig-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.06)} }
        @keyframes aig-orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,20px)} }
        @keyframes aig-orb3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-35px)} }
        @keyframes aig-grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aig-glow { 0%,100%{box-shadow:0 0 20px rgba(108,59,255,0.35)} 50%{box-shadow:0 0 40px rgba(108,59,255,0.7),0 0 60px rgba(0,212,255,0.25)} }
        @keyframes aig-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes aig-spin1 { to{transform:rotate(360deg)} }
        @keyframes aig-spin2 { to{transform:rotate(-360deg)} }
        @keyframes aig-reveal { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes aig-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes aig-scan { 0%{top:-30%} 100%{top:130%} }
        @keyframes aig-tagfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes aig-correctflash { 0%{background:rgba(34,211,165,0)} 35%{background:rgba(34,211,165,0.22)} 100%{background:rgba(34,211,165,0.12)} }
        @keyframes aig-wrongflash { 0%{background:rgba(255,107,107,0)} 35%{background:rgba(255,107,107,0.26)} 100%{background:rgba(255,107,107,0.12)} }
        .aig-input:focus { border-color:rgba(108,59,255,0.7)!important; box-shadow:0 0 0 3px rgba(108,59,255,0.18),0 0 20px rgba(108,59,255,0.12)!important; }
        .aig-chip:hover:not(:disabled) { border-color:rgba(108,59,255,0.45)!important; background:rgba(108,59,255,0.1)!important; color:var(--violet-light)!important; transform:translateY(-2px); }
        .aig-diff:hover:not(:disabled) { transform:translateY(-3px) scale(1.03); }
        .aig-genbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 20px 60px rgba(108,59,255,0.6)!important; }
        .aig-genbtn:active:not(:disabled) { transform:translateY(0); }
        .aig-opt:hover:not(.aig-opt-disabled) { transform:translateX(5px)!important; }
        .aig-reveal-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(108,59,255,0.38)!important; }
        .aig-bottom-btn:hover { opacity:0.88; transform:translateY(-1px); }
      `}</style>

      {/* ── Ambient background orbs ── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-15%", left:"-8%", width:580, height:580, borderRadius:"50%", background:"radial-gradient(circle,rgba(108,59,255,0.14) 0%,transparent 68%)", animation:"aig-orb1 13s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"-8%", right:"-4%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,212,255,0.09) 0%,transparent 68%)", animation:"aig-orb2 16s ease-in-out infinite" }} />
        <div style={{ position:"absolute", top:"38%", right:"18%", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,165,0.07) 0%,transparent 68%)", animation:"aig-orb3 11s ease-in-out infinite" }} />
      </div>

      <div className="page page-narrow animate-fade" style={{ position:"relative", zIndex:1 }}>

        {/* ── Back ── */}
        <button className="btn btn-ghost btn-sm mb-24" onClick={() => navigate("/dashboard")} style={{ backdropFilter:"blur(8px)" }}>
          ← Back to Dashboard
        </button>

        {/* ══════════════════════════════════════════════════════
            HERO HEADER
        ══════════════════════════════════════════════════════ */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          {/* Live badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"6px 18px", borderRadius:999,
            background:"linear-gradient(135deg,rgba(108,59,255,0.18),rgba(0,212,255,0.09))",
            border:"1px solid rgba(108,59,255,0.28)",
            fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--cyan)",
            marginBottom:20, animation:"aig-glow 3s ease-in-out infinite",
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--cyan)", animation:"aig-blink 1.4s step-end infinite" }} />
            AI Powered · Groq LLaMA 3.3
          </div>

          <h1 style={{
            fontFamily:"Space Grotesk,sans-serif",
            fontSize:"clamp(26px,5.5vw,46px)",
            fontWeight:800, lineHeight:1.1, letterSpacing:"-1px", marginBottom:16,
            background:"linear-gradient(135deg,#fff 0%,#c4b5fd 35%,#00D4FF 70%,#22D3A5 100%)",
            backgroundSize:"200% 200%",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            animation:"aig-grad 6s ease infinite",
          }}>
            Generate Any Quiz<br />Instantly with AI
          </h1>

          <p style={{ color:"var(--text-3)", fontSize:15, lineHeight:1.65, maxWidth:400, margin:"0 auto" }}>
            Type any topic · Pick difficulty · Get real AI-crafted questions in seconds
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════
            CONFIG CARD
        ══════════════════════════════════════════════════════ */}
        <div style={{
          background:"rgba(28,22,48,0.82)", backdropFilter:"blur(24px)",
          border:"1px solid rgba(108,59,255,0.22)",
          borderRadius:24, padding:32, marginBottom:24,
          boxShadow:"0 4px 48px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05)",
          position:"relative", overflow:"hidden",
        }}>
          {/* top shimmer line */}
          <div style={{ position:"absolute", top:0, left:"8%", right:"8%", height:1, background:"linear-gradient(90deg,transparent,rgba(108,59,255,0.55),rgba(0,212,255,0.3),transparent)" }} />

          {/* ── Topic Input ── */}
          <div style={{ marginBottom:26 }}>
            <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"var(--text-3)", marginBottom:11 }}>
              <span style={{ width:15, height:15, borderRadius:4, background:"var(--grad-violet)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"white" }}>✦</span>
              Topic
            </label>
            <div style={{ position:"relative" }}>
              <input
                ref={inputRef}
                className="aig-input"
                style={{ width:"100%", padding:"15px 18px 15px 50px", background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.09)", borderRadius:13, fontSize:15, color:"var(--text-1)", outline:"none", fontFamily:"DM Sans,sans-serif", transition:"all 0.2s ease", boxSizing:"border-box" }}
                placeholder='e.g. "Binary Trees", "React Hooks", "Photosynthesis"'
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
                disabled={loading}
              />
              <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontSize:19, pointerEvents:"none" }}>🔍</span>
              {topic && !loading && (
                <button onClick={() => { setTopic(""); inputRef.current?.focus(); }} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.09)", border:"none", borderRadius:"50%", width:22, height:22, cursor:"pointer", color:"var(--text-3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>✕</button>
              )}
            </div>

            {/* Suggested chips */}
            <div style={{ marginTop:11, display:"flex", flexWrap:"wrap", gap:7 }}>
              {SUGGESTED_TOPICS.map((t, i) => (
                <button key={t} className="aig-chip" onClick={() => setTopic(t)} disabled={loading}
                  style={{
                    padding:"4px 11px", background: topic===t ? "rgba(108,59,255,0.18)" : "rgba(255,255,255,0.04)", border:`1px solid ${topic===t ? "rgba(108,59,255,0.45)" : "rgba(255,255,255,0.07)"}`, borderRadius:999, fontSize:12, color: topic===t ? "var(--violet-light)" : "var(--text-3)", cursor:"pointer", transition:"all 0.2s ease", fontFamily:"DM Sans,sans-serif",
                    animation:`aig-tagfloat ${2+(i%3)*0.5}s ease-in-out ${i*0.08}s infinite`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Difficulty ── */}
          <div style={{ marginBottom:26 }}>
            <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"var(--text-3)", marginBottom:11 }}>
              <span style={{ width:15, height:15, borderRadius:4, background:"var(--grad-coral)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"white" }}>✦</span>
              Difficulty
            </label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {DIFFICULTY_OPTIONS.map((d) => {
                const on = difficulty === d.id;
                return (
                  <button key={d.id} className="aig-diff" onClick={() => setDifficulty(d.id)} disabled={loading}
                    style={{
                      padding:"14px 8px",
                      background: on ? `linear-gradient(135deg,${d.color}20,${d.color}08)` : "rgba(255,255,255,0.03)",
                      border:`1.5px solid ${on ? d.color+"55" : "rgba(255,255,255,0.07)"}`,
                      borderRadius:14, cursor:"pointer",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                      boxShadow: on ? `0 0 22px ${d.glow},inset 0 1px 0 ${d.color}18` : "none",
                      transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      position:"relative", overflow:"hidden",
                    }}>
                    {on && <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 50% 0%,${d.color}14,transparent 68%)` }} />}
                    <span style={{ fontSize:22 }}>{d.icon}</span>
                    <span style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:14, color: on ? d.color : "var(--text-2)" }}>{d.label}</span>
                    <span style={{ fontSize:11, color:"var(--text-3)" }}>{d.desc}</span>
                    {on && <div style={{ position:"absolute", bottom:0, left:"18%", right:"18%", height:2, background:`linear-gradient(90deg,transparent,${d.color},transparent)`, borderRadius:999 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Count ── */}
          <div style={{ marginBottom:26 }}>
            <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"var(--text-3)", marginBottom:11 }}>
              <span style={{ width:15, height:15, borderRadius:4, background:"var(--grad-cyan)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"white" }}>✦</span>
              Number of Questions
            </label>
            <div style={{ display:"flex", gap:10 }}>
              {COUNT_OPTIONS.map((n) => {
                const on = count === n;
                return (
                  <button key={n} onClick={() => setCount(n)} disabled={loading}
                    style={{
                      flex:1, padding:"13px 8px",
                      background: on ? "linear-gradient(135deg,rgba(108,59,255,0.28),rgba(0,212,255,0.14))" : "rgba(255,255,255,0.03)",
                      border:`1.5px solid ${on ? "rgba(108,59,255,0.48)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius:12, cursor:"pointer",
                      fontFamily:"Space Grotesk,sans-serif", fontWeight:800, fontSize:18,
                      color: on ? "white" : "var(--text-3)",
                      transition:"all 0.2s ease",
                      boxShadow: on ? "0 0 18px rgba(108,59,255,0.28)" : "none",
                    }}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Summary pill ── */}
          {topic.trim() && (
            <div style={{ padding:"10px 15px", borderRadius:11, marginBottom:20, background:"rgba(108,59,255,0.07)", border:"1px solid rgba(108,59,255,0.18)", fontSize:13, color:"var(--text-2)", display:"flex", alignItems:"center", gap:8, animation:"aig-reveal 0.3s ease" }}>
              <span>🎯</span>
              <span>
                Generating <strong style={{ color:"white" }}>{count}</strong>{" "}
                <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:999, fontSize:11, background:`${diffMeta.color}1A`, color:diffMeta.color, border:`1px solid ${diffMeta.color}38` }}>
                  {diffMeta.icon} {diffMeta.label}
                </span>
                {" "}questions on{" "}
                <strong style={{ color:"var(--violet-light)" }}>"{topic.trim()}"</strong>
              </span>
            </div>
          )}

          {/* ── Generate Button ── */}
          <button className="aig-genbtn" onClick={handleGenerate} disabled={loading || !topic.trim()}
            style={{
              width:"100%", padding:"17px 24px",
              background: loading ? "rgba(108,59,255,0.25)" : "linear-gradient(135deg,#6C3BFF 0%,#4F8EF7 50%,#00D4FF 100%)",
              backgroundSize:"200% 200%",
              animation: !loading && topic.trim() ? "aig-grad 3s ease infinite" : "none",
              border:"none", borderRadius:15,
              fontFamily:"Space Grotesk,sans-serif", fontSize:16, fontWeight:700, color:"white",
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              opacity: !topic.trim() ? 0.45 : 1,
              boxShadow: loading || !topic.trim() ? "none" : "0 10px 40px rgba(108,59,255,0.48)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:12,
              transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              position:"relative", overflow:"hidden",
            }}>
            {/* scan line */}
            {!loading && topic.trim() && (
              <div style={{ position:"absolute", left:0, right:0, height:"28%", background:"linear-gradient(180deg,rgba(255,255,255,0.07),transparent)", animation:"aig-scan 3s linear infinite", pointerEvents:"none" }} />
            )}
            {loading ? (
              <>
                <div style={{ position:"relative", width:22, height:22, flexShrink:0 }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2.5px solid rgba(255,255,255,0.12)", borderTopColor:"white", animation:"aig-spin1 0.75s linear infinite" }} />
                  <div style={{ position:"absolute", inset:5, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.07)", borderBottomColor:"rgba(255,255,255,0.55)", animation:"aig-spin2 1.1s linear infinite" }} />
                </div>
                <span style={{ fontSize:14 }}>{loadingMsg}</span>
              </>
            ) : (
              <><span style={{ fontSize:20 }}>✨</span>Generate {count} Questions<span style={{ marginLeft:4, opacity:0.7 }}>→</span></>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            SKELETON LOADING
        ══════════════════════════════════════════════════════ */}
        {phase === "loading" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[...Array(Math.min(count, 4))].map((_, i) => (
              <div key={i} style={{ background:"rgba(28,22,48,0.65)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:20, padding:24, animation:`aig-reveal 0.4s ease ${i*0.07}s both` }}>
                <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                  {[28,55].map((w,j)=>(
                    <div key={j} style={{ width:w, height:20, borderRadius:999, background:"linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)", backgroundSize:"200% 100%", animation:"aig-shimmer 1.4s infinite" }} />
                  ))}
                </div>
                {[100,72].map((w,j)=>(
                  <div key={j} style={{ height:17, width:`${w}%`, borderRadius:7, marginBottom:8, background:"linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.05) 75%)", backgroundSize:"200% 100%", animation:`aig-shimmer 1.4s infinite ${j*0.18}s` }} />
                ))}
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:14 }}>
                  {[...Array(4)].map((_,j)=>(
                    <div key={j} style={{ height:46, borderRadius:11, background:"linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)", backgroundSize:"200% 100%", animation:`aig-shimmer 1.4s infinite ${j*0.14}s` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            RESULTS
        ══════════════════════════════════════════════════════ */}
        {phase === "results" && questions.length > 0 && (
          <>
            {/* ── Score bar ── */}
            <div style={{
              background:"linear-gradient(135deg,rgba(34,211,165,0.07),rgba(0,212,255,0.04))",
              border:"1px solid rgba(34,211,165,0.18)",
              borderRadius:20, padding:"18px 24px", marginBottom:22,
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14,
              animation:"aig-reveal 0.5s ease",
            }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-3)", marginBottom:3 }}>Your Progress</div>
                <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:14 }}>{revealedCount} of {questions.length} answered</div>
              </div>
              <div style={{ display:"flex", gap:20 }}>
                {[
                  { val:correctCount, label:"Correct", color:"var(--mint)" },
                  { val:revealedCount-correctCount, label:"Wrong", color:"var(--coral)" },
                  { val:revealedCount>0?Math.round((correctCount/revealedCount)*100):0, label:"Accuracy", color:"var(--cyan)", suffix:"%" },
                ].map((s,i,arr) => (
                  <div key={s.label} style={{ display:"flex", alignItems:"center", gap:20 }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:800, fontSize:26, color:s.color, lineHeight:1 }}>
                        <AnimatedNumber value={s.val} suffix={s.suffix||""} />
                      </div>
                      <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>{s.label}</div>
                    </div>
                    {i<arr.length-1 && <div style={{ width:1, height:36, background:"rgba(255,255,255,0.07)" }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section label ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:17 }}>{questions.length} Questions Generated</div>
                <div style={{ fontSize:13, color:"var(--text-3)", marginTop:2 }}>Pick an answer → Reveal to check</div>
              </div>
              <span style={{ padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:600, background:`${diffMeta.color}1A`, color:diffMeta.color, border:`1px solid ${diffMeta.color}38` }}>
                {diffMeta.icon} {diffMeta.label}
              </span>
            </div>

            {/* ── Question Cards ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {questions.map((q, qIdx) => {
                const attempt   = attempts[qIdx] || { selected:null, revealed:false };
                const revealed  = attempt.revealed;
                const selected  = attempt.selected;
                const isCorrect = revealed && selected === q.correctAnswer;

                return (
                  <div key={qIdx} style={{
                    background: revealed ? (isCorrect ? "rgba(34,211,165,0.04)" : "rgba(255,107,107,0.04)") : "rgba(28,22,48,0.75)",
                    backdropFilter:"blur(18px)",
                    border:`1.5px solid ${revealed ? (isCorrect ? "rgba(34,211,165,0.32)" : "rgba(255,107,107,0.32)") : "rgba(255,255,255,0.07)"}`,
                    borderRadius:20, overflow:"hidden",
                    transition:"border-color 0.3s ease, background 0.3s ease",
                    animation:`aig-reveal 0.45s ease ${qIdx*0.06}s both`,
                  }}>
                    {/* coloured progress strip */}
                    <div style={{ height:3, background:"rgba(255,255,255,0.04)" }}>
                      <div style={{ height:"100%", width:`${((qIdx+1)/questions.length)*100}%`, background: revealed?(isCorrect?"var(--mint)":"var(--coral)"):"linear-gradient(90deg,var(--violet),var(--cyan))", transition:"width 0.5s ease, background 0.4s ease" }} />
                    </div>

                    <div style={{ padding:"20px 22px" }}>
                      {/* header row */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <div style={{ width:27, height:27, borderRadius:7, background:"linear-gradient(135deg,var(--violet),var(--cyan))", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Space Grotesk,sans-serif", fontWeight:800, fontSize:11, color:"white", flexShrink:0 }}>
                            {qIdx+1}
                          </div>
                          <span style={{ padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:600, background:`${diffMeta.color}18`, color:diffMeta.color, border:`1px solid ${diffMeta.color}32` }}>
                            {diffMeta.icon} {q.difficulty || difficulty}
                          </span>
                        </div>
                        {revealed && (
                          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 11px", borderRadius:999, fontSize:12, fontWeight:700, background: isCorrect?"rgba(34,211,165,0.14)":"rgba(255,107,107,0.14)", color: isCorrect?"var(--mint)":"var(--coral)", border:`1px solid ${isCorrect?"rgba(34,211,165,0.28)":"rgba(255,107,107,0.28)"}`, animation:"aig-reveal 0.3s ease" }}>
                            {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                          </div>
                        )}
                      </div>

                      {/* question text */}
                      <h3 style={{ fontFamily:"Space Grotesk,sans-serif", fontSize:16, fontWeight:600, lineHeight:1.55, color:"var(--text-1)", marginBottom:16 }}>
                        {revealed ? <Typewriter text={q.question} speed={14} /> : q.question}
                      </h3>

                      {/* options */}
                      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                        {q.options.map((opt, optIdx) => {
                          const isCorrectOpt = optIdx === q.correctAnswer;
                          const isSelectedOpt = optIdx === selected;
                          let bg, bdr, col, lbg, lcol;

                          if (revealed) {
                            if (isCorrectOpt)        { bg="rgba(34,211,165,0.11)";   bdr="rgba(34,211,165,0.48)";   col="var(--mint)";         lbg="var(--mint)";   lcol="white"; }
                            else if (isSelectedOpt)  { bg="rgba(255,107,107,0.11)";  bdr="rgba(255,107,107,0.48)";  col="var(--coral)";        lbg="var(--coral)";  lcol="white"; }
                            else                     { bg="rgba(255,255,255,0.02)";  bdr="rgba(255,255,255,0.06)";  col="var(--text-3)";       lbg="rgba(255,255,255,0.05)"; lcol="var(--text-3)"; }
                          } else if (isSelectedOpt)  { bg="rgba(108,59,255,0.11)";   bdr="rgba(108,59,255,0.48)";   col="var(--violet-light)"; lbg="var(--violet)"; lcol="white"; }
                          else                       { bg="rgba(255,255,255,0.025)"; bdr="rgba(255,255,255,0.07)";  col="var(--text-1)";       lbg="rgba(255,255,255,0.06)"; lcol="var(--text-3)"; }

                          return (
                            <button key={optIdx}
                              className={`aig-opt${revealed?" aig-opt-disabled":""}`}
                              onClick={() => handleSelect(qIdx, optIdx)}
                              style={{
                                width:"100%", padding:"12px 15px",
                                background:bg, border:`1.5px solid ${bdr}`, borderRadius:12,
                                cursor: revealed?"default":"pointer",
                                display:"flex", alignItems:"center", gap:11, textAlign:"left",
                                fontFamily:"DM Sans,sans-serif", transition:"all 0.18s ease",
                                animation: revealed&&isCorrectOpt?"aig-correctflash 0.5s ease" : revealed&&isSelectedOpt&&!isCorrectOpt?"aig-wrongflash 0.5s ease":"none",
                              }}>
                              <div style={{ width:29, height:29, borderRadius:7, background:lbg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:lcol, transition:"all 0.2s ease", flexShrink:0 }}>
                                {LETTERS[optIdx]}
                              </div>
                              <span style={{ flex:1, fontSize:14, color:col, transition:"color 0.2s" }}>{opt}</span>
                              {revealed && isCorrectOpt    && <span style={{ fontSize:15, flexShrink:0 }}>✓</span>}
                              {revealed && isSelectedOpt && !isCorrectOpt && <span style={{ fontSize:15, flexShrink:0 }}>✗</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* reveal / explanation */}
                      {!revealed ? (
                        <button className="aig-reveal-btn" onClick={() => handleReveal(qIdx)} disabled={selected===null}
                          style={{
                            width:"100%", padding:"12px 18px",
                            background: selected!==null ? "linear-gradient(135deg,rgba(108,59,255,0.38),rgba(0,212,255,0.18))" : "rgba(255,255,255,0.04)",
                            border:`1.5px solid ${selected!==null?"rgba(108,59,255,0.38)":"rgba(255,255,255,0.06)"}`,
                            borderRadius:12, cursor:selected!==null?"pointer":"not-allowed",
                            fontFamily:"Space Grotesk,sans-serif", fontWeight:600, fontSize:14,
                            color: selected!==null?"white":"var(--text-3)",
                            transition:"all 0.2s ease",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                          }}>
                          {selected!==null ? <><span>🔓</span>Reveal Answer</> : <><span style={{opacity:0.45}}>👆</span>Select an option first</>}
                        </button>
                      ) : (
                        <div style={{ padding:"13px 16px", background:"rgba(108,59,255,0.08)", border:"1px solid rgba(108,59,255,0.2)", borderRadius:12, animation:"aig-reveal 0.4s ease" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                            <span style={{ width:22, height:22, borderRadius:6, background:"rgba(108,59,255,0.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>💡</span>
                            <span style={{ fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:12, color:"var(--violet-light)", letterSpacing:"0.04em", textTransform:"uppercase" }}>Explanation</span>
                          </div>
                          <p style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.72, margin:0 }}>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Bottom CTAs ── */}
            <div style={{ display:"flex", gap:12, marginTop:30, flexWrap:"wrap" }}>
              <button className="aig-bottom-btn" onClick={handleGenerate}
                style={{
                  flex:1, padding:"15px 20px",
                  background:"linear-gradient(135deg,#6C3BFF,#00D4FF)", backgroundSize:"200% 200%",
                  animation:"aig-grad 3s ease infinite",
                  border:"none", borderRadius:14,
                  fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:15, color:"white",
                  cursor:"pointer", boxShadow:"0 8px 30px rgba(108,59,255,0.42)",
                  transition:"all 0.22s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                ✨ Regenerate
              </button>
              <button className="aig-bottom-btn" onClick={() => navigate("/quiz")}
                style={{
                  flex:1, padding:"15px 20px",
                  background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:14,
                  fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:15, color:"var(--text-1)",
                  cursor:"pointer", transition:"all 0.22s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                ▶ Take a Real Quiz
              </button>
            </div>
            <div style={{ height:48 }} />
          </>
        )}
      </div>
    </>
  );
}