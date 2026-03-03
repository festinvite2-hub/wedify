import { useState, useEffect, useCallback, useMemo, useRef, useReducer } from "react";
import { LOGO_SM, CSS } from "./lib/constants";
import { mkid, gCount, sumGuests, gTypeLabel, gTypeIcon, fmtD, fmtC, parseBudgetNotes, serializeBudgetNotes, loadTheme, saveTheme, generateGuestsPDF, generateTablesPDF, openPDF } from "./lib/utils";
import { ic } from "./lib/icons";
import { getSupabase } from "./lib/supabase-client";
import { loadAllData, dbSync } from "./lib/db-sync";
import { INITIAL_DATA, reducer } from "./state/reducer";
import { AppContext, useApp } from "./context/AppContext";
import { Btn } from "./ui/Btn";
import { Card } from "./ui/Card";
import { Modal } from "./ui/Modal";
import { Fld } from "./ui/Fld";
import { Badge } from "./ui/Badge";
import { Toast } from "./ui/Toast";
import { EmptyState } from "./ui/EmptyState";
import { SearchBar } from "./ui/SearchBar";
import { Header } from "./ui/Header";
import { TabBar } from "./ui/TabBar";

// ═══════════════════════════════════════════════════════════════
// WEDIFY v1.0 — Wedding Organizer | Rebranded from Wedify v14
// ═══════════════════════════════════════════════════════════════

// ─── Confirm Dialog ──────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 320, background: "var(--cd)", color: "var(--ink)", borderRadius: "var(--r)", padding: "24px 20px", boxShadow: "0 12px 40px rgba(0,0,0,.15)", animation: "fadeUp .25s ease-out both" }}>
        <h4 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{title || "Confirmare"}</h4>
        <p style={{ fontSize: 13, color: "var(--gr)", marginBottom: 20, lineHeight: 1.5 }}>{message || "Ești sigur? Acțiunea nu poate fi anulată."}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={onClose} full>Anulează</Btn>
          <Btn v="danger" onClick={() => { onConfirm(); onClose(); }} full>Șterge</Btn>
        </div>
      </div>
    </div>
  );
}

function Stars({v,onChange}){return <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><button key={i} onClick={()=>onChange?.(i)} style={{padding:1,color:i<=v?"var(--g)":"var(--ft)"}}>{i<=v?ic.star:ic.starO}</button>)}</div>}

// ─── AUTH ────────────────────────────────────────────────────
// ─── Auth Screen (Supabase production) ───────────────────────
function AuthScreen({onLogin}){
  const[mode,setMode]=useState("login"); // login | register | forgot | confirm | forgot_sent
  const[email,setEmail]=useState("");
  const[name,setName]=useState("");
  const[pass,setPass]=useState("");
  const[pass2,setPass2]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);
  const[ready,setReady]=useState(false);
  useEffect(()=>{setTimeout(()=>setReady(true),100)},[]);

  const doLogin=async()=>{
    setErr("");const e=email.trim().toLowerCase();
    if(!e)return setErr("Introdu email-ul");
    if(!pass)return setErr("Introdu parola");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server. Verifică .env.local.");}
    const{error}=await sb.auth.signInWithPassword({email:e,password:pass});
    setLoading(false);
    if(error){
      if(error.message.includes("Invalid login"))return setErr("Email sau parolă incorectă.");
      if(error.message.includes("Email not confirmed"))return setErr("Contul nu e confirmat. Verifică email-ul.");
      return setErr(error.message);
    }
    // onAuthStateChange in App will handle the rest
  };

  const doRegister=async()=>{
    setErr("");const e=email.trim().toLowerCase();const n=name.trim();
    if(!n)return setErr("Introdu numele tău");
    if(!e)return setErr("Introdu email-ul");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))return setErr("Email invalid");
    if(pass.length<6)return setErr("Parola: minim 6 caractere");
    if(pass!==pass2)return setErr("Parolele nu coincid");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server.");}
    const{error}=await sb.auth.signUp({
      email:e,password:pass,
      options:{data:{name:n}}
    });
    setLoading(false);
    if(error){
      if(error.message.includes("already registered"))return setErr("Există deja un cont cu acest email.");
      return setErr(error.message);
    }
    setMode("confirm");
  };

  const doForgot=async()=>{
    setErr("");const e=email.trim().toLowerCase();
    if(!e)return setErr("Introdu email-ul contului");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server.");}
    const{error}=await sb.auth.resetPasswordForEmail(e,{
      redirectTo:window.location.origin
    });
    setLoading(false);
    if(error)return setErr(error.message);
    setMode("forgot_sent");
  };

  const inp={width:"100%",padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:15,marginBottom:10,backdropFilter:"blur(4px)"};
  const mBtn={width:"100%",padding:15,borderRadius:14,background:loading?"rgba(184,149,106,.55)":"linear-gradient(135deg,var(--g),var(--gd))",color:"#fff",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 26px rgba(0,0,0,.22)"};
  const spin=<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .5s linear infinite"}}/>;

  return(
    <div style={{minHeight:"100svh",width:"100%",maxWidth:"100vw",position:"relative",display:"flex",flexDirection:"column",background:"radial-gradient(circle at 12% 8%,rgba(184,149,106,.16),transparent 35%), radial-gradient(circle at 88% 95%,rgba(184,149,106,.14),transparent 38%), linear-gradient(155deg,#171513,#241E19,#171513)",overflowX:"hidden",overflowY:"auto",padding:"max(18px,env(safe-area-inset-top,0px)) 16px max(18px,env(safe-area-inset-bottom,0px))",boxSizing:"border-box",opacity:ready?1:0,transition:"opacity .7s"}}>
      <div style={{position:"absolute",top:-60,right:-70,width:240,height:240,background:"radial-gradient(circle,rgba(184,149,106,.16),transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-70,left:-80,width:260,height:260,background:"radial-gradient(circle,rgba(184,149,106,.12),transparent 72%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:760,margin:"0 auto",minHeight:"calc(100svh - 36px)",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"center",padding:"4px 0 18px"}}>
          <img src={LOGO_SM} alt="Wedify" style={{width:"min(48vw,190px)",height:"min(48vw,190px)",objectFit:"contain",filter:"drop-shadow(0 10px 22px rgba(0,0,0,.5))"}} />
        </div>
        <div style={{width:"100%",background:"rgba(17,16,14,.42)",backdropFilter:"blur(18px)",borderRadius:24,padding:"28px 24px",border:"1px solid rgba(255,255,255,.08)",boxShadow:"0 20px 60px rgba(0,0,0,.35)"}}>

          {mode==="login"&&<>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:20}}>Conectare</h2>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inp} autoComplete="email"/>
            <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Parola" type="password" style={inp} autoComplete="current-password"/>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12,animation:"shake .3s"}}>{err}</div>}
            <button onClick={doLogin} disabled={loading} style={mBtn}>{loading&&spin}Intră</button>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
              <button onClick={()=>{setMode("forgot");setErr("")}} style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>Am uitat parola</button>
              <button onClick={()=>{setMode("register");setErr("");setPass("");setPass2("")}} style={{fontSize:12,color:"var(--gl)",opacity:.9,fontWeight:600}}>Creează cont →</button>
            </div>
          </>}

          {mode==="register"&&<>
            <button onClick={()=>{setMode("login");setErr("")}} style={{color:"var(--gl)",fontSize:12,marginBottom:12,opacity:.7}}>← Conectare</button>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:16}}>Creare cont</h2>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Numele tău complet" type="text" style={inp} autoComplete="name"/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inp} autoComplete="email"/>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Parolă (min 6 caractere)" type="password" style={inp} autoComplete="new-password"/>
            <input value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doRegister()} placeholder="Confirmă parola" type="password" style={inp} autoComplete="new-password"/>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12,animation:"shake .3s"}}>{err}</div>}
            <button onClick={doRegister} disabled={loading} style={mBtn}>{loading&&spin}Creează contul</button>
          </>}

          {mode==="confirm"&&<>
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>📧</div>
              <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",marginBottom:8}}>Verifică email-ul</h2>
              <p style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:6}}>Am trimis un link de confirmare la:</p>
              <p style={{fontSize:14,color:"var(--gl)",fontWeight:600,marginBottom:18}}>{email}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:18}}>Verifică și folderul Spam.</p>
              <button onClick={()=>{setMode("login");setErr("");setPass("")}} style={mBtn}>Mergi la conectare</button>
            </div>
          </>}

          {mode==="forgot"&&<>
            <button onClick={()=>{setMode("login");setErr("")}} style={{color:"var(--gl)",fontSize:12,marginBottom:12,opacity:.7}}>← Conectare</button>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:16}}>Resetare parolă</h2>
            <p style={{fontSize:12,color:"rgba(255,255,255,.35)",textAlign:"center",marginBottom:14}}>Introdu emailul contului tău</p>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doForgot()} placeholder="Email" type="email" style={inp}/>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12}}>{err}</div>}
            <button onClick={doForgot} disabled={loading} style={mBtn}>{loading&&spin}Trimite link de resetare</button>
          </>}

          {mode==="forgot_sent"&&<>
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>🔑</div>
              <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",marginBottom:8}}>Email trimis!</h2>
              <p style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:18}}>Verifică inbox-ul pentru linkul de resetare.</p>
              <button onClick={()=>{setMode("login");setErr("");setPass("")}} style={mBtn}>Mergi la conectare</button>
            </div>
          </>}

        </div>
        <div style={{padding:"12px 4px 4px",textAlign:"center",fontSize:10,color:"rgba(255,255,255,.18)"}}>Wedify · Wedding Organizer</div>
      </div>
    </div>
  );
}

// ─── Access Manager ──────────────────────────────────────────
function AccessMgr({open,onClose,whitelist,setWhitelist}){
  const[ne,setNe]=useState("");const[nn,setNn]=useState("");
  const add=()=>{const e=ne.trim().toLowerCase();if(!e||whitelist.some(w=>w.email===e))return;setWhitelist([...whitelist,{email:e,name:nn||e.split("@")[0]}]);setNe("");setNn("")};
  return(<Modal open={open} onClose={onClose} title="Gestionare Acces">
    <div style={{fontSize:12,color:"var(--mt)",marginBottom:14}}>Persoanele adăugate aici pot accesa aplicația. La prima conectare își setează parola.</div>
    <div style={{display:"flex",gap:6,marginBottom:6}}>
      <input value={ne} onChange={e=>setNe(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="email@exemplu.ro" style={{flex:1,padding:"10px 12px",borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
      <button onClick={add} style={{width:38,height:38,borderRadius:"var(--rs)",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ic.plus}</button>
    </div>
    <input value={nn} onChange={e=>setNn(e.target.value)} placeholder="Nume (opțional)" style={{width:"100%",padding:"10px 12px",marginBottom:14,borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--mt)",marginBottom:8}}>Persoane ({whitelist.length})</div>
    {whitelist.map((w,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:i?"1px solid var(--bd)":"none"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:"var(--cr2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--gd)",flexShrink:0}}>{w.name?.[0]?.toUpperCase()||"?"}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600}}>{w.name}</div><div style={{fontSize:11,color:"var(--mt)"}}>{w.email}</div></div>
        <button onClick={()=>setWhitelist(whitelist.filter((_,j)=>j!==i))} style={{padding:4,color:"var(--ft)"}}>{ic.trash}</button>
      </div>
    ))}
  </Modal>);
}

// ─── Wedding Settings ────────────────────────────────────────
function SettingsModal({open,onClose}){
  const{s,d,theme,setTheme}=useApp();
  const[f,setF]=useState({});
  useEffect(()=>{if(open)setF({...s.wedding})},[open]);
  const u=k=>v=>setF(x=>({...x,[k]:v}));
  const[groups,setGroups]=useState(()=>s.groups||["Familie Mireasă","Familie Mire","Prieteni","Colegi"]);
  const[tags,setTags]=useState(()=>s.tags||["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"]);
  const[newG,setNewG]=useState("");
  const[newT,setNewT]=useState("");
  const addG=()=>{const g=newG.trim();if(g&&!groups.includes(g)){setGroups([...groups,g]);setNewG("")}};
  const addT=()=>{const t=newT.trim();if(t&&!tags.includes(t)){setTags([...tags,t]);setNewT("")}};
  return(<Modal open={open} onClose={onClose} title="Setări">
    {/* Dark mode toggle */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",marginBottom:12,borderBottom:"1px solid var(--bd)"}}>
      <div>
        <div style={{fontSize:13,fontWeight:600}}>Mod întunecat</div>
        <div style={{fontSize:11,color:"var(--mt)"}}>Schimbă tema aplicației</div>
      </div>
      <button onClick={()=>{const n=theme==="dark"?"light":"dark";setTheme(n);saveTheme(n)}} style={{width:48,height:28,borderRadius:14,background:theme==="dark"?"var(--g)":"var(--cr2)",border:"1px solid var(--bd)",position:"relative",transition:"all .2s"}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:"var(--cd)",position:"absolute",top:2,left:theme==="dark"?23:2,transition:"left .2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {theme==="dark"?ic.moon:ic.sun}
        </div>
      </button>
    </div>

    <Fld label="Numele mirilor" value={f.couple} onChange={u("couple")} placeholder="Alexandra & Mihai"/>
    <Fld label="Data nunții" value={f.date} onChange={u("date")} type="date"/>
    <Fld label="Locația" value={f.venue} onChange={u("venue")} placeholder="Palatul Mogoșoaia"/>
    <Fld label="Buget total (€)" value={f.budget} onChange={v=>u("budget")(parseFloat(v)||0)} type="number"/>
    <Fld label="Invitați estimați (țintă)" value={f.guestTarget ?? 100} onChange={v=>u("guestTarget")(Math.max(1, parseInt(v || "0", 10) || 1))} type="number"/>
    
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--mt)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Grupuri invitați</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {groups.map((g,i)=>(
          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:14,fontSize:12,background:"var(--cr)",border:"1px solid var(--bd)"}}>
            {g}<button onClick={()=>setGroups(groups.filter((_,j)=>j!==i))} style={{padding:1,color:"var(--mt)",display:"flex"}}>{ic.x}</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={newG} onChange={e=>setNewG(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addG()} placeholder="Grup nou..." style={{flex:1,padding:"9px 11px",borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
        <button onClick={addG} style={{width:36,height:36,borderRadius:"var(--rs)",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic.plus}</button>
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--mt)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Tag-uri disponibile</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
        {tags.map((t,i)=>(
          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:12,fontSize:11,background:"var(--cr)",border:"1px solid var(--bd)"}}>
            {t}<button onClick={()=>setTags(tags.filter((_,j)=>j!==i))} style={{padding:1,color:"var(--mt)",display:"flex"}}>{ic.x}</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={newT} onChange={e=>setNewT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addT()} placeholder="Tag nou..." style={{flex:1,padding:"9px 11px",borderRadius:"var(--rs)",background:"var(--cr)",border:"1.5px solid var(--bd)",fontSize:13}}/>
        <button onClick={addT} style={{width:36,height:36,borderRadius:"var(--rs)",background:"var(--g)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic.plus}</button>
      </div>
    </div>

    <Btn full onClick={()=>{d({type:"SET",p:{wedding:f,groups,tags}});onClose()}}>Salvează</Btn>

    {/* Logout */}
    <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--bd)"}}>
      <button onClick={async()=>{
        if(confirm("Sigur vrei să te deconectezi?")){
          const sb=getSupabase();
          if(sb) await sb.auth.signOut();
          window.location.reload();
        }
      }} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 16px",borderRadius:"var(--rs)",background:"rgba(184,92,92,.06)",border:"1.5px solid rgba(184,92,92,.15)",color:"var(--er)",fontSize:13,fontWeight:600,transition:"all .15s"}}>
        {ic.logout} Deconectare
      </button>
      <div style={{textAlign:"center",marginTop:8,fontSize:10,color:"var(--mt)"}}>Wedify v1.0 · Wedding Organizer</div>
    </div>
  </Modal>);
}

// ═══════════════════════════════════════════════════════════════
// DATA + REDUCER
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Home() {
  const { s, setShowSettings, setTab } = useApp();
  const days = Math.max(0, Math.ceil((new Date(s.wedding.date) - new Date()) / 864e5));
  const conf = s.guests.filter(g => g.rsvp === "confirmed").length;
  const pend = s.guests.filter(g => g.rsvp === "pending").length;
  const decl = s.guests.filter(g => g.rsvp === "declined").length;
  const confPpl = sumGuests(s.guests.filter(g => g.rsvp === "confirmed"));
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);
  const bP = tP > 0 ? Math.round((tS / tP) * 100) : 0;
  const doneT = s.tasks.filter(t => t.status === "done").length;
  const seated = s.guests.filter(g => g.tid).length;
  const seatedConfPpl = sumGuests(s.guests.filter(g => g.tid && g.rsvp === "confirmed"));
  const urgent = s.tasks.filter(t => t.prio === "high" && t.status !== "done");
  const overdue = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;
  const paidC = s.budget.filter(b => b.status === "paid").length;
  const partC = s.budget.filter(b => b.status === "partial").length;
  const unpC = s.budget.filter(b => b.status === "unpaid").length;
  const costPerGuest = confPpl > 0 ? Math.round(tP / confPpl) : 0;
  const unseatedConfPpl = Math.max(confPpl - seatedConfPpl, 0);
  const todaysActions = [
    overdue > 0 && { id: "overdue", title: `Rezolvă ${overdue} task-uri depășite`, hint: "Deschide timeline-ul", tab: "tasks", c: "var(--er)" },
    unseatedConfPpl > 0 && { id: "seating", title: `Alocă ${unseatedConfPpl} persoane la mese`, hint: "Finalizează planul de mese", tab: "tables", c: "var(--g)" },
    pend > 0 && { id: "rsvp", title: `Urmărește ${pend} RSVP în așteptare`, hint: "Sună / trimite reminder", tab: "guests", c: "#5A82B4" },
    unpC > 0 && { id: "budget", title: `${unpC} categorii sunt neplătite`, hint: "Verifică bugetul", tab: "budget", c: "var(--wn)" },
  ].filter(Boolean).slice(0, 3);

  return (
    <div className="fu" style={{ padding: "4px 14px 24px" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(145deg,var(--cd),var(--cr))", borderRadius: "var(--r)", padding: "18px 16px", marginBottom: 12, position: "relative", overflow: "hidden", border: "1px solid var(--bd)", boxShadow: "var(--sh)" }}>
        <div style={{ position: "absolute", top: -45, right: -35, width: 150, height: 150, background: "radial-gradient(circle,rgba(184,149,106,.2),transparent 70%)", borderRadius: "50%" }} />
        <button onClick={() => setShowSettings(true)} style={{ position: "absolute", top: 10, right: 10, padding: 5, color: "var(--mt)", zIndex: 2 }}>{ic.edit}</button>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><span style={{ color: "var(--g)" }}>{ic.heart}</span><span style={{ fontSize: 9, color: "var(--gd)", textTransform: "uppercase", letterSpacing: ".15em", fontWeight: 700 }}>Countdown</span></div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 44, fontWeight: 500, color: "var(--gd)", lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>zile rămase</div>
          <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{s.wedding.couple}</div>
          <div style={{ fontSize: 11, color: "var(--gr)", marginTop: 2 }}>{fmtD(s.wedding.date)} · {s.wedding.venue}</div>
          <div style={{ fontSize: 10, color: "var(--mt)", marginTop: 4 }}>Țintă invitați: {Math.max(1, Number(s.wedding.guestTarget) || 100)}</div>
        </div>
      </div>

      {/* Stats */}
      {/* Overdue warning banner */}
      {overdue > 0 && <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: "var(--r)", background: "rgba(184,92,92,.08)", border: "1.5px solid rgba(184,92,92,.2)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(184,92,92,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--er)" }}>{overdue} task-uri depășite</div>
          <div style={{ fontSize: 11, color: "var(--gr)" }}>Verifică secțiunea Tasks pentru detalii</div>
        </div>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { l: "Confirmați", v: conf, sub: `${pend} așteptare · ${decl} refuz`, cl: "var(--ok)", tab: "guests" },
          { l: "Așezați", v: `${seatedConfPpl}/${confPpl}`, sub: `${Math.max(confPpl - seatedConfPpl, 0)} rămași`, cl: "var(--g)", tab: "tables" },
          { l: "Tasks", v: `${Math.round((doneT / Math.max(s.tasks.length, 1)) * 100)}%`, sub: `${doneT}/${s.tasks.length} gata`, cl: overdue > 0 ? "var(--er)" : "var(--ok)", tab: "tasks" },
          { l: "Total invitați", v: s.guests.length, sub: `${sumGuests(s.guests)} persoane · ${s.guests.filter(g => g.dietary).length} cu restricții`, cl: "var(--g)", tab: "guests" },
          { l: "Cost/persoană", v: fmtC(costPerGuest), sub: `buget ${fmtC(tP)} / ${confPpl} pers. confirmate`, cl: "var(--gd)", tab: "budget" },
        ].map((x, i) => (
          <Card key={i} onClick={() => setTab(x.tab)} style={{ padding: "12px 10px", cursor: "pointer" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 5 }}>{x.l}</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 500, color: x.cl, lineHeight: 1.1 }}>{x.v}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", marginTop: 1 }}>{x.sub}</div>
          </Card>
        ))}
      </div>

      {todaysActions.length > 0 && <Card style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Ce să faci azi</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {todaysActions.map(a => <button key={a.id} onClick={() => setTab(a.tab)} style={{ textAlign: "left", padding: "9px 10px", borderRadius: 10, border: "1px solid var(--bd)", background: "var(--cr)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.c, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{a.title}</div>
              <div style={{ fontSize: 10, color: "var(--mt)" }}>{a.hint}</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--gd)", fontWeight: 700 }}>→</span>
          </button>)}
        </div>
      </Card>}

      {/* Budget dashboard — ENHANCED */}
      <Card style={{ marginBottom: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Buget</span>
          <span style={{ fontFamily: "var(--fd)", fontSize: 20, color: bP > 90 ? "var(--er)" : "var(--g)" }}>{bP}%</span>
        </div>
        <div style={{ height: 8, background: "var(--cr2)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(bP, 100)}%`, background: bP > 90 ? "linear-gradient(90deg,var(--wn),var(--er))" : "linear-gradient(90deg,var(--gl),var(--g))", transition: "width 1s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Cheltuit</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: "var(--g)" }}>{fmtC(tS)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Planificat</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{fmtC(tP)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Rămas</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 500, color: tP - tS >= 0 ? "var(--ok)" : "var(--er)" }}>{fmtC(tP - tS)}</div>
          </div>
        </div>
        {/* Status chips */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(107,158,104,.08)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ok)" }}>{paidC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>plătite</div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(90,130,180,.08)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#5A82B4" }}>{partC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>parțial</div>
          </div>
          <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: "rgba(160,160,160,.06)", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mt)" }}>{unpC}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>neplătite</div>
          </div>
        </div>
        {/* Top categories */}
        <div style={{ marginTop: 10 }}>
          {s.budget.slice(0, 3).map(b => {
            const p = Math.round((b.spent / Math.max(b.planned, 1)) * 100);
            return (<div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 11, flex: 1, fontWeight: 500 }}>{b.cat}</span>
              <div style={{ width: 60, height: 4, background: "var(--cr2)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, width: `${Math.min(p, 100)}%`, background: p > 100 ? "var(--er)" : "var(--g)" }} /></div>
              <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 32, textAlign: "right" }}>{p}%</span>
            </div>);
          })}
        </div>
      </Card>

      {/* Urgent */}
      {urgent.length > 0 && <Card>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Urgente</div>
        {urgent.slice(0, 4).map((t, i) => <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: i ? "1px solid var(--bd)" : "none" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div><div style={{ fontSize: 10, color: "var(--mt)" }}>{fmtD(t.due)}</div></div></div>)}
      </Card>}

      {/* Export buttons */}
      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 10 }}>Export</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="secondary" onClick={() => openPDF(generateGuestsPDF(s.guests, s.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Lista invitați</Btn>
          <Btn v="secondary" onClick={() => openPDF(generateTablesPDF(s.tables, s.guests, s.wedding))} style={{ flex: 1, fontSize: 11, padding: "9px 12px" }}>📄 Plan mese</Btn>
        </div>
      </Card>

      {/* Activity log */}
      {(s.activity || []).length > 0 && <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Activitate recentă</div>
        {(s.activity || []).slice(0, 8).map((a, i) => {
          const ago = Math.round((Date.now() - new Date(a.ts).getTime()) / 60000);
          const agoText = ago < 1 ? "acum" : ago < 60 ? `${ago}m` : ago < 1440 ? `${Math.round(ago / 60)}h` : `${Math.round(ago / 1440)}z`;
          return (<div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? "1px solid var(--bd)" : "none" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--g)", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: "var(--gr)" }}>{a.msg}</div>
            <div style={{ fontSize: 10, color: "var(--ft)", flexShrink: 0 }}>{agoText}</div>
          </div>);
        })}
      </Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GUESTS — with configurable groups
// ═══════════════════════════════════════════════════════════════
function Guests() {
  const { s, d } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qn, setQn] = useState("");
  const [qg, setQg] = useState(s.groups?.[0] || "Prieteni");
  const [qType, setQType] = useState("single");
  const [qFamilySize, setQFamilySize] = useState(3);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const ref = useRef(null);
  const groups = s.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];

  const list = useMemo(() => {
    let l = s.guests;
    if (filter !== "all") l = l.filter(g => g.rsvp === filter);
    if (tagFilter) l = l.filter(g => (g.tags || []).includes(tagFilter));
    if (search) l = l.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return l;
  }, [s.guests, filter, search, tagFilter]);

  const grouped = useMemo(() => { const g = {}; list.forEach(x => { const k = x.group || "Altele"; if (!g[k]) g[k] = []; g[k].push(x) }); return g }, [list]);
  const st = { total: s.guests.length, conf: s.guests.filter(g => g.rsvp === "confirmed").length, pend: s.guests.filter(g => g.rsvp === "pending").length, totalPpl: sumGuests(s.guests), confPpl: sumGuests(s.guests.filter(g => g.rsvp === "confirmed")), pendPpl: sumGuests(s.guests.filter(g => g.rsvp === "pending")) };
  const groupStats = useMemo(() => { const gs = {}; s.guests.forEach(g => { const k = g.group || "Altele"; gs[k] = (gs[k] || 0) + 1 }); return Object.entries(gs).map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(s.guests.length, 1)) * 100) })); }, [s.guests]);
  const allTags = useMemo(() => { const t = new Set(s.tags || []); s.guests.forEach(g => (g.tags || []).forEach(tag => t.add(tag))); return [...t]; }, [s.guests, s.tags]);
  const gCl = ["#B8956A","#8BA888","#D4A0A0","#5A82B4","#C9A032","#9A9A9A","#A088B8","#B85C5C"];

  const quickCount = qType === "couple" ? 2 : qType === "family" ? Math.max(3, Number(qFamilySize) || 3) : 1;
  const quickAdd = () => { const n = qn.trim(); if (!n) return; d({ type: "ADD_GUEST", p: { id: mkid(), name: n, group: qg, rsvp: "pending", dietary: "", tid: null, notes: "", tags: [], count: quickCount } }); setQn(""); ref.current?.focus() };
  const cycleRsvp = g => { const nx = { pending: "confirmed", confirmed: "declined", declined: "pending" }; d({ type: "UPD_GUEST", p: { id: g.id, rsvp: nx[g.rsvp] } }) };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ l: "Total", v: st.total, ppl: st.totalPpl, f: "all" }, { l: "Conf.", v: st.conf, ppl: st.confPpl, f: "confirmed" }, { l: "Aștept.", v: st.pend, ppl: st.pendPpl, f: "pending" }].map(x => (
          <button key={x.f} onClick={() => setFilter(f => f === x.f ? "all" : x.f)} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: filter === x.f ? "var(--ink)" : "var(--cd)", color: filter === x.f ? "var(--bg)" : "var(--mt)", border: `1px solid ${filter === x.f ? "var(--ink)" : "var(--bd)"}` }}>
            {x.l} <span style={{ fontFamily: "var(--fd)", fontSize: 14, marginLeft: 3 }}>{x.v}</span>{x.ppl !== x.v && <span style={{ fontSize: 9, opacity: .6, marginLeft: 2 }}>({x.ppl}p)</span>}
          </button>))}
        <button onClick={() => setShowStats(!showStats)} style={{ padding: "6px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: showStats ? "rgba(184,149,106,.1)" : "var(--cd)", color: showStats ? "var(--gd)" : "var(--mt)", border: `1px solid ${showStats ? "var(--g)" : "var(--bd)"}`, marginLeft: "auto" }}>📊</button>
      </div>

      {showStats && <Card style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Distribuție pe grupuri</div>
        {groupStats.map((g, i) => (
          <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: gCl[i % gCl.length], flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
            <div style={{ width: 80, height: 6, background: "var(--cr2)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, width: `${g.pct}%`, background: gCl[i % gCl.length] }} /></div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gd)", minWidth: 24, textAlign: "right" }}>{g.count}</span>
            <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 26 }}>{g.pct}%</span>
          </div>
        ))}
      </Card>}

      {allTags.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
        <span style={{ fontSize: 10, color: "var(--mt)", alignSelf: "center", marginRight: 2, flexShrink: 0 }}>{ic.tag}</span>
        {allTags.map(t => { const cnt = s.guests.filter(g => (g.tags || []).includes(t)).length; return (
          <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, background: tagFilter === t ? "var(--gd)" : "var(--cr)", color: tagFilter === t ? "#fff" : "var(--gr)", border: `1px solid ${tagFilter === t ? "var(--gd)" : "var(--bd)"}` }}>{t} <span style={{ opacity: .6 }}>{cnt}</span></button>
        ); })}
      </div>}

      {/* Quick add with configurable groups */}
      <Card style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(184,149,106,.03)", border: "1.5px dashed var(--gl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)" }}>⚡ Adaugă rapid</div>
          <button onClick={() => setShowImport(true)} style={{ fontSize: 10, fontWeight: 600, color: "var(--g)", padding: "3px 8px", borderRadius: 8, background: "rgba(184,149,106,.08)" }}>📥 Import CSV</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 7 }}>
          <input ref={ref} value={qn} onChange={e => setQn(e.target.value)} onKeyDown={e => e.key === "Enter" && quickAdd()} placeholder="Nume invitat/familie..." style={{ flex: 1, padding: "9px 11px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 13 }} />
          <select value={qg} onChange={e => setQg(e.target.value)} style={{ padding: "9px 6px", borderRadius: "var(--rs)", background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 11, color: "var(--gr)", maxWidth: 110 }}>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={quickAdd} style={{ width: 38, height: 38, borderRadius: "var(--rs)", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[{k:"single",l:"👤 Single"},{k:"couple",l:"👫 Cuplu"},{k:"family",l:"👨‍👩‍👧 Familie"}].map(t => (
            <button key={t.k} onClick={() => setQType(t.k)} style={{ padding: "5px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: qType === t.k ? "var(--gd)" : "var(--cd)", color: qType === t.k ? "#fff" : "var(--gr)", border: `1px solid ${qType === t.k ? "var(--gd)" : "var(--bd)"}` }}>{t.l}</button>
          ))}
          {qType === "family" && <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 2 }}>
            <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700 }}>Persoane</span>
            <button onClick={() => setQFamilySize(v => Math.max(3, v - 1))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--bd)", background: "var(--cd)", fontWeight: 700, color: "var(--gr)" }}>−</button>
            <span style={{ minWidth: 14, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--gd)" }}>{qFamilySize}</span>
            <button onClick={() => setQFamilySize(v => Math.min(12, v + 1))} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--bd)", background: "var(--cd)", fontWeight: 700, color: "var(--gr)" }}>+</button>
          </div>}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--mt)", fontWeight: 600 }}>Se adaugă: {quickCount} pers.</span>
        </div>
      </Card>

      <SearchBar value={search} onChange={setSearch} placeholder="Caută..." style={{ marginBottom: 12 }} />

      {Object.entries(grouped).map(([gn, gl]) => (
        <div key={gn} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5, paddingLeft: 2 }}>{gn} ({gl.length})</div>
          {gl.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "var(--cd)", borderRadius: "var(--rs)", border: "1px solid var(--bd)", marginBottom: 5 }}>
              <button onClick={() => cycleRsvp(g)} title="Apasă pentru a schimba statusul" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--cr2)", color: g.rsvp === "pending" ? "var(--mt)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: g.rsvp === "pending" ? "2px dashed var(--ft)" : "none", transition: "all .2s" }}>
                  {g.rsvp === "confirmed" ? "✓" : g.rsvp === "declined" ? "✕" : "?"}
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, color: g.rsvp === "confirmed" ? "var(--ok)" : g.rsvp === "declined" ? "var(--er)" : "var(--mt)", textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1 }}>
                  {g.rsvp === "confirmed" ? "Da" : g.rsvp === "declined" ? "Nu" : "Apasă"}
                </span>
              </button>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => { setEditing(g); setShowForm(true) }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 1, flexWrap: "wrap" }}>{g.dietary && <Badge c="rose">{g.dietary}</Badge>}{g.tid && <Badge c="green">Așezat</Badge>}{g.notes && <span style={{ fontSize: 10, color: "var(--mt)" }} title={g.notes}>📝</span>}{(g.tags||[]).map(t=><Badge key={t} c="blue">{t}</Badge>)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDel(g.id) }} style={{ padding: 4, color: "var(--ft)" }}>{ic.trash}</button>
            </div>
          ))}
        </div>
      ))}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => d({ type: "DEL_GUEST", p: confirmDel })} title="Șterge invitatul?" message="Invitatul va fi eliminat din listă și de la masă. Acțiunea nu poate fi anulată." />

      <ImportCSV open={showImport} onClose={() => setShowImport(false)} />

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Invitat nou"}>
        {showForm && <GuestFormInner guest={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function GuestFormInner({ guest, onClose }) {
  const { s, d } = useApp();
  const groups = s.groups || ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"];
  const allTags = s.tags || ["Copil","Cazare","Parcare","Din alt oraș","Martor","Naș/Nașă"];
  const [f, setF] = useState(guest ? { ...guest, tags: guest.tags || [], count: guest.count || 1 } : { name: "", group: groups[0], rsvp: "pending", dietary: "", notes: "", tags: [], count: 1 });
  const u = k => v => setF(x => ({ ...x, [k]: v }));
  const toggleTag = t => setF(x => ({ ...x, tags: x.tags.includes(t) ? x.tags.filter(v => v !== t) : [...x.tags, t] }));
  return <>
    <Fld label="Nume" value={f.name} onChange={u("name")} />
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <div style={{flex:1}}>
        <Fld label="Grup" value={f.group} onChange={u("group")} options={groups} />
      </div>
      <div style={{width:100}}>
        <Fld label="Persoane" value={f.count} onChange={v=>u("count")(Number(v)||1)} options={[{value:1,label:"👤 1"},{value:2,label:"👫 2"},{value:3,label:"👨‍👩‍👧 3"},{value:4,label:"👨‍👩‍👧‍👦 4"},{value:5,label:"5"},{value:6,label:"6"}]} />
      </div>
    </div>
    <Fld label="RSVP" value={f.rsvp} onChange={u("rsvp")} options={[{ value: "pending", label: "Așteptare" }, { value: "confirmed", label: "Confirmat" }, { value: "declined", label: "Refuzat" }]} />
    <Fld label="Restricții alimentare" value={f.dietary} onChange={u("dietary")} placeholder="vegetarian, vegan..." />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Tag-uri</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {allTags.map(t => (
          <button key={t} onClick={() => toggleTag(t)} style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: f.tags.includes(t) ? "var(--gd)" : "var(--cr)", color: f.tags.includes(t) ? "#fff" : "var(--gr)", border: `1px solid ${f.tags.includes(t) ? "var(--gd)" : "var(--bd)"}` }}>{t}</button>
        ))}
      </div>
    </div>
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Vine cu copil, necesită cazare..." />
    <Btn full onClick={() => { d({ type: guest ? "UPD_GUEST" : "ADD_GUEST", p: { ...f, id: guest?.id || mkid(), tid: f.tid || null } }); onClose() }} disabled={!f.name}>{guest ? "Salvează" : "Adaugă"}</Btn>
  </>;
}

// ── Seated Guest Row (extracted for hooks) ──────────────────
function SeatedGuestRow({ g, table, isMoving, setMovingGuest, moveGuest, unseat, gAt, allTables }) {
  const [showInfo, setShowInfo] = useState(false);
  const hasInfo = g.dietary || (g.tags||[]).length > 0 || g.notes;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 14, fontSize: 12, fontWeight: 500, background: isMoving ? "rgba(184,149,106,.08)" : "var(--cr)", border: `1px solid ${isMoving ? "var(--g)" : "var(--bd)"}` }}>
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
          {g.name}{gCount(g)>1&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:6,background:"rgba(184,149,106,.12)",color:"var(--gd)",fontWeight:700}}>×{gCount(g)}</span>}
          {g.dietary && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} title={g.dietary} />}
          {(g.tags||[]).includes("Copil") && <span style={{ fontSize: 10 }} title="Vine cu copil">👶</span>}
          {(g.tags||[]).includes("Vegetarian") && <span style={{ fontSize: 10 }} title="Vegetarian">🌱</span>}
        </span>
        {hasInfo && <button onClick={() => setShowInfo(!showInfo)} style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, color: showInfo ? "var(--g)" : "var(--mt)", background: showInfo ? "rgba(184,149,106,.1)" : "transparent" }}>ℹ</button>}
        <button onClick={() => setMovingGuest(isMoving ? null : { gid: g.id, fromTid: table.id })} style={{ padding: "1px 4px", color: isMoving ? "var(--g)" : "var(--mt)", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>↗</button>
        <button onClick={() => unseat(g.id)} style={{ padding: 1, color: "var(--mt)", display: "flex" }}>{ic.x}</button>
      </div>
      {showInfo && <div style={{ padding: "6px 12px", marginTop: 2, marginBottom: 2, borderRadius: 8, background: "rgba(184,149,106,.04)", border: "1px solid var(--bd)", fontSize: 11 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {g.dietary && <Badge c="rose">{g.dietary}</Badge>}
          {(g.tags||[]).map(t => <Badge key={t} c="blue">{t}</Badge>)}
          {g.rsvp === "confirmed" && <Badge c="green">Confirmat</Badge>}
        </div>
        {g.notes && <div style={{ marginTop: 4, color: "var(--mt)", fontStyle: "italic" }}>📝 {g.notes}</div>}
      </div>}
      {isMoving && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 4px", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "var(--mt)", alignSelf: "center", marginRight: 2 }}>Mută la:</span>
          {allTables.filter(t => t.id !== table.id).map(t => {
            const cnt = gAt(t.id).reduce((a, g) => a + gCount(g), 0);
            const full = cnt >= t.seats;
            return (
              <button key={t.id} disabled={full} onClick={() => moveGuest(g.id, t.id)} style={{
                padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: full ? "var(--cr2)" : "rgba(184,149,106,.08)", border: `1px solid ${full ? "var(--bd)" : "var(--gl)"}`,
                color: full ? "var(--ft)" : "var(--gd)", opacity: full ? .5 : 1,
              }}>
                {t.name} <span style={{ fontSize: 9, color: "var(--mt)" }}>{cnt}/{t.seats}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🔥 TABLES — List cards, edit seats, FIXED add bug
// ═══════════════════════════════════════════════════════════════
function TablesList() {
  const { s, d } = useApp();
  const [expanded, setExpanded] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [pickingFor, setPickingFor] = useState(null);
  const [searchG, setSearchG] = useState("");
  const [editingTable, setEditingTable] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [movingGuest, setMovingGuest] = useState(null); // {gid, fromTid}
  const [tableFilter, setTableFilter] = useState("all");
  const [tableSort, setTableSort] = useState("default");
  const [viewMode, setViewMode] = useState("list");
  const [dragTid, setDragTid] = useState(null);

  const unassigned = useMemo(() => s.guests.filter(g => !g.tid && g.rsvp === "confirmed"), [s.guests]);
  const gAt = useCallback(tid => s.guests.filter(g => g.tid === tid), [s.guests]);
  const totalSeats = s.tables.reduce((a, t) => a + t.seats, 0); // seats = person capacity
  const totalSeated = sumGuests(s.guests.filter(g => g.tid));

  const toggle = tid => setExpanded(e => ({ ...e, [tid]: !e[tid] }));
  const seat = (gid, tid) => d({ type: "SEAT", p: { gid, tid } });
  const unseat = gid => d({ type: "UNSEAT", p: gid });
  const moveGuest = (gid, newTid) => { d({ type: "MOVE_SEAT", p: { gid, tid: newTid } }); setMovingGuest(null); };

  const avail = useMemo(() => {
    let l = unassigned;
    if (searchG) l = l.filter(g => g.name.toLowerCase().includes(searchG.toLowerCase()));
    return l;
  }, [unassigned, searchG]);

  const tableStats = useMemo(() => s.tables.map(t => {
    const seated = gAt(t.id);
    const seatedPersons = seated.reduce((a, g) => a + gCount(g), 0);
    const free = t.seats - seatedPersons;
    return { ...t, seated, seatedPersons, free, isFull: free <= 0 };
  }), [s.tables, gAt]);

  const displayedTables = useMemo(() => {
    let list = [...tableStats];
    if (tableFilter === "free") list = list.filter(t => t.free > 0);
    if (tableFilter === "full") list = list.filter(t => t.free <= 0);
    if (tableSort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ro"));
    if (tableSort === "free_desc") list.sort((a, b) => b.free - a.free);
    if (tableSort === "free_asc") list.sort((a, b) => a.free - b.free);
    return list;
  }, [tableStats, tableFilter, tableSort]);

  const moveTableOrder = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    const arr = [...s.tables];
    const from = arr.findIndex(t => t.id === fromId);
    const to = arr.findIndex(t => t.id === toId);
    if (from < 0 || to < 0) return;
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    d({ type: "REORDER_TABLES", p: arr });
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Locuri ocupate</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 500, color: "var(--g)" }}>{totalSeated}<span style={{ fontSize: 13, color: "var(--mt)", fontFamily: "var(--f)" }}> / {totalSeats}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Nealocați</div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 500, color: unassigned.length > 0 ? "var(--wn)" : "var(--ok)" }}>{unassigned.length}</div>
        </div>
      </Card>

      <Card style={{ marginBottom: 12, padding: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700 }}>Filtru</span>
          {[{k:"all",l:"Toate"},{k:"free",l:"Cu locuri libere"},{k:"full",l:"Complete"}].map(f => <button key={f.k} onClick={() => setTableFilter(f.k)} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: tableFilter===f.k ? "var(--gd)" : "var(--cr)", color: tableFilter===f.k ? "#fff" : "var(--gr)", border: `1px solid ${tableFilter===f.k ? "var(--gd)" : "var(--bd)"}` }}>{f.l}</button>)}
          <span style={{ fontSize: 10, color: "var(--mt)", fontWeight: 700, marginLeft: 6 }}>Sortare</span>
          <select value={tableSort} onChange={e => setTableSort(e.target.value)} style={{ padding: "5px 8px", borderRadius: 10, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 10, color: "var(--gr)" }}>
            <option value="default">Implicit</option>
            <option value="name">Nume A-Z</option>
            <option value="free_desc">Locuri libere desc</option>
            <option value="free_asc">Locuri libere asc</option>
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: viewMode === "list" ? "var(--ink)" : "var(--cr)", color: viewMode === "list" ? "var(--bg)" : "var(--mt)", border: `1px solid ${viewMode === "list" ? "var(--ink)" : "var(--bd)"}` }}>Listă</button>
            <button onClick={() => setViewMode("grid")} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: viewMode === "grid" ? "var(--ink)" : "var(--cr)", color: viewMode === "grid" ? "var(--bg)" : "var(--mt)", border: `1px solid ${viewMode === "grid" ? "var(--ink)" : "var(--bd)"}` }}>Grid</button>
          </div>
        </div>
      </Card>

      {viewMode === "grid" && <Card style={{ marginBottom: 12, padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Sumar vizual mese</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
          {displayedTables.map(t => <button key={t.id} onClick={() => { setExpanded(e => ({ ...e, [t.id]: true })); setViewMode("list"); }} style={{ textAlign: "left", padding: "8px", borderRadius: 10, border: "1px solid var(--bd)", background: t.free > 0 ? "var(--cr)" : "rgba(107,158,104,.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: "var(--mt)" }}>{t.seatedPersons}/{t.seats} pers · {t.free > 0 ? `${t.free} libere` : "Completă"}</div>
          </button>)}
        </div>
      </Card>}

      {/* Unassigned chips — just names, no instruction text */}
      {unassigned.length > 0 && <Card style={{ marginBottom: 12, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6 }}>Nealocați ({unassigned.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {unassigned.slice(0, 30).map(g => (
            <span key={g.id} style={{ padding: "4px 9px", borderRadius: 12, fontSize: 11, fontWeight: 500, background: "var(--cr)", border: "1px solid var(--bd)", display: "inline-flex", alignItems: "center", gap: 3 }}>
              {g.name.split(" ")[0]}
              {g.dietary && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--er)" }} />}
            </span>
          ))}
          {unassigned.length > 30 && <span style={{ padding: "4px 9px", fontSize: 11, color: "var(--mt)" }}>+{unassigned.length - 30}</span>}
        </div>
      </Card>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>{s.tables.length} mese</span>
        <Btn v="secondary" onClick={() => setShowAdd(true)} style={{ fontSize: 11, padding: "5px 12px" }}>{ic.plus} Masă nouă</Btn>
      </div>

      {(viewMode === "list" ? displayedTables : []).map(table => {
        const seated = gAt(table.id);
        const seatedPersons = seated.reduce((a, g) => a + gCount(g), 0);
        const free = table.seats - seatedPersons;
        const isFull = free <= 0;
        const isOpen = expanded[table.id];
        const isPicking = pickingFor === table.id;

        return (
          <Card key={table.id} draggable={tableSort === "default" && tableFilter === "all"} onDragStart={() => setDragTid(table.id)} onDragOver={e => { if (dragTid) e.preventDefault(); }} onDrop={() => { moveTableOrder(dragTid, table.id); setDragTid(null); }} onDragEnd={() => setDragTid(null)} style={{ marginBottom: 8, padding: 0, overflow: "hidden", opacity: dragTid && dragTid !== table.id ? .96 : 1 }}>
            <div onClick={() => toggle(table.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: table.shape === "round" ? "50%" : 8, background: isFull ? "rgba(107,158,104,.1)" : "var(--cr)", border: `1.5px solid ${isFull ? "var(--ok)" : "var(--bd)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isFull ? "var(--ok)" : "var(--gd)" }}>{seated.length}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>{tableSort === "default" && tableFilter === "all" && <span style={{ color: "var(--ft)", fontSize: 12 }}>↕</span>}{table.name}</div>
                <div style={{ fontSize: 11, color: "var(--mt)" }}>
                  {table.shape === "round" ? "Rotundă" : "Dreptunghiulară"} · {table.seats} locuri · <span style={{ color: isFull ? "var(--ok)" : "var(--gd)", fontWeight: 600 }}>{free} libere</span>
                </div>
              </div>
              <span style={{ color: "var(--ft)", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>{ic.chevD}</span>
            </div>

            {isOpen && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bd)" }}>
              {/* Table notes */}
              {table.notes && <div style={{ fontSize: 11, color: "var(--mt)", fontStyle: "italic", padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>📝 {table.notes}</div>}
              {seated.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 0" }}>
                {seated.map(g => {
                  const isMoving = movingGuest?.gid === g.id;
                  return (
                    <SeatedGuestRow key={g.id} g={g} table={table} isMoving={isMoving} setMovingGuest={setMovingGuest} moveGuest={moveGuest} unseat={unseat} gAt={gAt} allTables={s.tables} />
                  );
                })}
              </div> : <div style={{ padding: "10px 0", fontSize: 12, color: "var(--mt)", fontStyle: "italic" }}>Niciun invitat</div>}

              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {!isFull && <Btn v="secondary" onClick={() => { setPickingFor(isPicking ? null : table.id); setSearchG("") }} style={{ fontSize: 11, padding: "7px 12px", flex: 1, border: isPicking ? "2px solid var(--g)" : "1px solid var(--bd)", background: isPicking ? "rgba(184,149,106,.06)" : "var(--cr)" }}>
                  {isPicking ? "Anulează" : "+ Adaugă invitați"}
                </Btn>}
                <Btn v="ghost" onClick={() => setEditingTable(table)} style={{ fontSize: 11, padding: "7px 10px" }}>{ic.edit}</Btn>
                <Btn v="danger" onClick={() => setConfirmDel(table.id)} style={{ fontSize: 11, padding: "7px 10px" }}>{ic.trash}</Btn>
              </div>

              {isPicking && <div style={{ marginTop: 10, padding: 10, borderRadius: "var(--rs)", background: "rgba(184,149,106,.04)", border: "1px solid var(--gl)" }}>
                <SearchBar value={searchG} onChange={setSearchG} placeholder="Caută invitat..." style={{ marginBottom: 8 }} />
                {avail.length === 0 ? <div style={{ fontSize: 11, color: "var(--mt)", textAlign: "center", padding: 8 }}>Toți invitații sunt așezați</div>
                  : <div style={{ maxHeight: 160, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                    {avail.map(g => (
                      <button key={g.id} onClick={() => { seat(g.id, table.id); if (seatedPersons + gCount(g) >= table.seats) setPickingFor(null) }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", textAlign: "left" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--cr2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gd)", flexShrink: 0 }}>{g.name[0]}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: 10, color: "var(--mt)" }}>{g.group}{g.dietary ? ` · ${g.dietary}` : ""}</div></div>
                        <span style={{ color: "var(--g)", fontSize: 11, fontWeight: 600 }}>+ Adaugă</span>
                      </button>
                    ))}
                  </div>}
              </div>}
            </div>}
          </Card>
        );
      })}

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => { d({ type: "DEL_TABLE", p: confirmDel }); setExpanded(e => { const n = { ...e }; delete n[confirmDel]; return n }); }} title="Șterge masa?" message="Toți invitații de la această masă vor deveni nealocați." />

      {/* Add table modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Masă nouă">
        <AddTableForm onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit table modal */}
      <Modal open={!!editingTable} onClose={() => setEditingTable(null)} title="Editare masă">
        {editingTable && <EditTableForm table={editingTable} onClose={() => setEditingTable(null)} />}
      </Modal>
    </div>
  );
}

function AddTableForm({ onClose }) {
  const { s, d } = useApp();
  const [name, setName] = useState("Masa " + (s.tables.length + 1));
  const [shape, setShape] = useState("round");
  const [seats, setSeats] = useState(8);

  const handleAdd = () => {
    if (!name.trim()) return;
    d({ type: "ADD_TABLE", p: { id: mkid(), name: name.trim(), shape, seats: Number(seats) || 8 } });
    onClose();
  };

  return <>
    <Fld label="Nume" value={name} onChange={setName} placeholder="Masa 5" />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Formă</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "round", l: "Rotundă", i: "●" }, { v: "rectangular", l: "Dreptunghi", i: "▬" }].map(sh => (
          <button key={sh.v} onClick={() => setShape(sh.v)} style={{ flex: 1, padding: "12px 8px", borderRadius: "var(--rs)", textAlign: "center", border: `2px solid ${shape === sh.v ? "var(--g)" : "var(--bd)"}`, background: shape === sh.v ? "rgba(184,149,106,.05)" : "var(--cr)" }}>
            <div style={{ fontSize: 20, opacity: .4, marginBottom: 3 }}>{sh.i}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: shape === sh.v ? "var(--gd)" : "var(--mt)" }}>{sh.l}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Număr locuri" value={seats} onChange={v => setSeats(v)} type="number" />
    <Btn full onClick={handleAdd} disabled={!name.trim()}>Adaugă masa</Btn>
  </>;
}

function EditTableForm({ table, onClose }) {
  const { d } = useApp();
  const [name, setName] = useState(table.name);
  const [shape, setShape] = useState(table.shape);
  const [seats, setSeats] = useState(table.seats);
  const [notes, setNotes] = useState(table.notes || "");

  return <>
    <Fld label="Nume" value={name} onChange={setName} />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 5 }}>Formă</label>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: "round", l: "Rotundă", i: "●" }, { v: "rectangular", l: "Dreptunghi", i: "▬" }].map(sh => (
          <button key={sh.v} onClick={() => setShape(sh.v)} style={{ flex: 1, padding: "12px 8px", borderRadius: "var(--rs)", textAlign: "center", border: `2px solid ${shape === sh.v ? "var(--g)" : "var(--bd)"}`, background: shape === sh.v ? "rgba(184,149,106,.05)" : "var(--cr)" }}>
            <div style={{ fontSize: 20, opacity: .4, marginBottom: 3 }}>{sh.i}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: shape === sh.v ? "var(--gd)" : "var(--mt)" }}>{sh.l}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Număr locuri" value={seats} onChange={v => setSeats(v)} type="number" />
    <Fld label="Note" value={notes} onChange={setNotes} type="textarea" placeholder="Lângă ringul de dans, masă rotundă mare..." />
    <Btn full onClick={() => { d({ type: "UPD_TABLE", p: { id: table.id, name, shape, seats: Number(seats) || 8, notes } }); onClose() }} disabled={!name}>Salvează</Btn>
  </>;
}

// ═══════════════════════════════════════════════════════════════
// BUDGET — Enhanced dashboard
// ═══════════════════════════════════════════════════════════════
function BudgetMod() {
  const { s, d } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);
  const pct = tP > 0 ? Math.round((tS / tP) * 100) : 0;
  const cl = ["#B8956A", "#8BA888", "#D4A0A0", "#5A82B4", "#C9A032", "#B85C5C", "#9A9A9A", "#A088B8"];
  const vendorByName = useMemo(() => new Map((s.vendors || []).map(v => [(v.name || "").trim().toLowerCase(), v])), [s.vendors]);

  // SVG donut
  let angle = 0;
  const arcs = s.budget.map((b, i) => {
    const sl = tS > 0 ? (b.spent / tS) * 360 : 0;
    const s2 = angle; angle += sl;
    const sr = ((s2 - 90) * Math.PI) / 180, er = ((s2 + sl - 90) * Math.PI) / 180;
    const x1 = 55 + 42 * Math.cos(sr), y1 = 55 + 42 * Math.sin(sr);
    const x2 = 55 + 42 * Math.cos(er), y2 = 55 + 42 * Math.sin(er);
    return { path: `M55 55 L${x1} ${y1} A42 42 0 ${sl > 180 ? 1 : 0} 1 ${x2} ${y2}Z`, color: cl[i % cl.length], ...b };
  });

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      <Card style={{ marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} opacity={.85} />)}
          <circle cx={55} cy={55} r={22} fill="var(--cd)" />
          <text x={55} y={52} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--f)">{pct}%</text>
          <text x={55} y={63} textAnchor="middle" fontSize="7" fill="var(--mt)" fontFamily="var(--f)">consumat</text>
        </svg>
        <div style={{ flex: 1 }}>
          {[{ l: "Planificat", v: fmtC(tP), c: "var(--ink)" }, { l: "Cheltuit", v: fmtC(tS), c: "var(--g)" }, { l: "Rămas", v: fmtC(tP - tS), c: tP - tS >= 0 ? "var(--ok)" : "var(--er)" }].map(x => (
            <div key={x.l} style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>{x.l}</div><div style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 500, color: x.c }}>{x.v}</div></div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {s.budget.map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cl[i % cl.length] }} /><span style={{ color: "var(--gr)" }}>{b.cat}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Categorii</span>
        <Btn v="secondary" onClick={() => { setEditing(null); setShowForm(true) }} style={{ fontSize: 10, padding: "4px 10px" }}>{ic.plus} Adaugă</Btn>
      </div>
      {s.budget.map((b, i) => { const p = Math.round((b.spent / Math.max(b.planned, 1)) * 100); const linkedVendor = vendorByName.get((b.vendor || "").trim().toLowerCase()); return (
        <Card key={b.id} onClick={() => { setEditing(b); setShowForm(true) }} style={{ marginBottom: 7, cursor: "pointer", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: cl[i % cl.length] }} /><span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{b.cat}</span><Badge c={b.status === "paid" ? "green" : b.status === "partial" ? "blue" : "gray"}>{b.status === "paid" ? "Plătit" : b.status === "partial" ? "Parțial" : "Neplătit"}</Badge></div>
          {b.vendor && <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 3 }}>📍 {b.vendor}</div>}
          {linkedVendor && <div style={{ display: "flex", gap: 5, marginBottom: 4, flexWrap: "wrap" }}><Badge c={linkedVendor.status === "contracted" ? "green" : linkedVendor.status === "negotiating" ? "blue" : "gray"}>{linkedVendor.status === "contracted" ? "Contractat" : linkedVendor.status === "negotiating" ? "Negociere" : linkedVendor.status === "potential" ? "Potențial" : linkedVendor.status}</Badge><Badge c="gold">⭐ {linkedVendor.rating || 0}/5</Badge></div>}
          {b.notes && <div style={{ fontSize: 10, color: "var(--mt)", marginBottom: 3, fontStyle: "italic" }}>📝 {b.notes}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span>{fmtC(b.spent)}</span><span style={{ color: "var(--mt)" }}>{fmtC(b.planned)}</span></div>
          <div style={{ height: 4, background: "var(--cr2)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, width: `${Math.min(p, 100)}%`, background: p > 100 ? "var(--er)" : "var(--g)", transition: "width .5s" }} /></div>
          {p > 100 && <div style={{ fontSize: 9, color: "var(--er)", fontWeight: 600, marginTop: 2 }}>⚠ +{fmtC(b.spent - b.planned)}</div>}
        </Card>
      ) })}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Categorie nouă"}>
        {showForm && <BudgetFormInner item={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}

function BudgetFormInner({ item, onClose }) {
  const { s, d } = useApp();
  const [f, setF] = useState(item ? { ...item, payments: item.payments || [] } : { cat: "", planned: 0, spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] });
  const [showConfirm, setShowConfirm] = useState(false);
  const [pAmt, setPAmt] = useState(0);
  const [pDate, setPDate] = useState(new Date().toISOString().slice(0, 10));
  const [pNote, setPNote] = useState("");
  const u = k => v => setF(x => ({ ...x, [k]: v }));

  const norm = (v) => (v || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const sameCat = (vCat, bCat) => norm(vCat).includes(norm(bCat)) || norm(bCat).includes(norm(vCat));

  const vendors = s.vendors || [];
  const linkedByCat = vendors.filter(v => f.cat && sameCat(v.cat, f.cat));
  const contractedByCat = linkedByCat.find(v => v.status === "contracted");
  const vendorOptions = [{ value: "", label: "— Selectează furnizor —" }, ...vendors.map(v => ({ value: v.name, label: `${v.name}${v.cat ? ` · ${v.cat}` : ""}${v.status ? ` (${v.status})` : ""}` }))];

  useEffect(() => {
    if (!f.cat || f.vendor) return;
    if (contractedByCat?.name) setF(x => ({ ...x, vendor: contractedByCat.name }));
  }, [f.cat, f.vendor, contractedByCat?.name]);

  const payments = f.payments || [];
  const spentFromPayments = payments.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const effectiveSpent = payments.length > 0 ? spentFromPayments : (Number(f.spent) || 0);

  const addPayment = () => {
    const amt = Number(pAmt) || 0;
    if (amt <= 0) return;
    setF(x => ({ ...x, payments: [...(x.payments || []), { id: mkid(), amount: amt, date: pDate || new Date().toISOString().slice(0, 10), note: pNote || "" }], spent: spentFromPayments + amt }));
    setPAmt(0); setPNote("");
  };
  const delPayment = (id) => setF(x => {
    const nx = (x.payments || []).filter(p => p.id !== id);
    const spent = nx.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    return { ...x, payments: nx, spent };
  });

  return <>
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} />
    <Fld label="Planificat (€)" value={f.planned} onChange={v => u("planned")(parseFloat(v) || 0)} type="number" />
    <Fld label="Cheltuit total (€)" value={effectiveSpent} onChange={v => u("spent")(parseFloat(v) || 0)} type="number" />

    <div style={{ marginBottom: 12, padding: 10, borderRadius: "var(--rs)", border: "1px solid var(--bd)", background: "var(--cr)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>Istoric plăți</div>
      {(payments || []).length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
        {payments.map(pay => <div key={pay.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--cd)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gd)", minWidth: 68 }}>{fmtC(pay.amount)}</span>
          <span style={{ fontSize: 10, color: "var(--mt)", minWidth: 78 }}>{fmtD(pay.date)}</span>
          <span style={{ fontSize: 10, color: "var(--gr)", flex: 1, minWidth: 0 }}>{pay.note || "—"}</span>
          <button onClick={() => delPayment(pay.id)} style={{ padding: 2, color: "var(--mt)" }}>{ic.trash}</button>
        </div>)}
      </div> : <div style={{ fontSize: 11, color: "var(--mt)", marginBottom: 8 }}>Nicio plată înregistrată încă.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
        <input type="number" value={pAmt} onChange={e => setPAmt(e.target.value)} placeholder="Suma (€)" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12 }} />
        <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12 }} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={pNote} onChange={e => setPNote(e.target.value)} placeholder="Notă (avans, rată, rest...)" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "var(--cd)", border: "1px solid var(--bd)", fontSize: 12 }} />
        <Btn v="secondary" onClick={addPayment} style={{ fontSize: 11, padding: "8px 10px" }}>{ic.plus} Plată</Btn>
      </div>
    </div>

    {contractedByCat && <div style={{ marginBottom: 8, fontSize: 10, color: "var(--ok)", fontWeight: 600 }}>🔗 Sugestie automată pentru categorie: {contractedByCat.name} (contractat)</div>}
    <Fld label="Furnizor (din listă)" value={f.vendor} onChange={u("vendor")} options={vendorOptions} />
    <Fld label="Sau introdu manual" value={f.vendor} onChange={u("vendor")} placeholder="Nume furnizor..." />

    {linkedByCat.length > 0 && <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 5 }}>Furnizori pe această categorie</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {linkedByCat.map(v => <button key={v.id} onClick={() => u("vendor")(v.name)} style={{ padding: "4px 8px", borderRadius: 10, fontSize: 10, background: f.vendor === v.name ? "var(--gd)" : "var(--cr)", color: f.vendor === v.name ? "#fff" : "var(--gr)", border: `1px solid ${f.vendor === v.name ? "var(--gd)" : "var(--bd)"}` }}>{v.name} {v.status === "contracted" ? "✓" : ""}</button>)}
      </div>
    </div>}

    <Fld label="Status" value={f.status} onChange={u("status")} options={[{ value: "unpaid", label: "Neplătit" }, { value: "partial", label: "Parțial" }, { value: "paid", label: "Plătit" }]} />
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Plata în 2 rate, factură trimisă..." />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { const cleanNotes = f.notes || ""; d({ type: item ? "UPD_BUDGET" : "ADD_BUDGET", p: { ...f, spent: effectiveSpent, notes: cleanNotes, id: item?.id || mkid() } }); onClose() }} disabled={!f.cat}>Salvează</Btn>
      {item && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "DEL_BUDGET", p: item.id }); onClose() }} title="Șterge categoria?" message={`"${item?.cat}" va fi eliminată din buget.`} />
  </>;
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════
function TasksMod() {
  const { s, d } = useApp();
  const [filter, setFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const list = useMemo(() => { let l = [...s.tasks].sort((a, b) => new Date(a.due) - new Date(b.due)); if (filter === "active") l = l.filter(t => t.status !== "done"); if (filter === "done") l = l.filter(t => t.status === "done"); if (filter === "urgent") l = l.filter(t => t.prio === "high" && t.status !== "done"); return l }, [s.tasks, filter]);
  const done = s.tasks.filter(t => t.status === "done").length;
  const pct = Math.round((done / Math.max(s.tasks.length, 1)) * 100);
  const overdue = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;

  const wDate = new Date(s.wedding.date);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((wDate - now) / 864e5));

  const dueLabel = (due) => {
    if (!due) return "Fără termen";
    const d = new Date(due);
    const diff = Math.ceil((d - now) / 864e5);
    if (diff < 0) return `Depășit cu ${Math.abs(diff)} zile`;
    if (diff === 0) return "Astăzi!";
    if (diff === 1) return "Mâine";
    if (diff <= 7) return `Până în ${diff} zile`;
    if (diff <= 30) return `Până la ${fmtD(due)}`;
    return `Până la ${fmtD(due)}`;
  };

  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      {/* Progress + Stats */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Progres total</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 500, color: "var(--g)" }}>{pct}%</span>
              <span style={{ fontSize: 11, color: "var(--mt)" }}>{done}/{s.tasks.length} gata</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--gd)" }}>{daysLeft}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>zile rămase</div>
          </div>
        </div>
        <div style={{ height: 8, background: "var(--cr2)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: "linear-gradient(90deg,var(--g),var(--ok))", transition: "width .6s" }} />
        </div>
        {overdue > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(184,92,92,.06)" }}>
          <span style={{ fontSize: 11 }}>⚠</span>
          <span style={{ fontSize: 11, color: "var(--er)", fontWeight: 600 }}>{overdue} task-uri depășite</span>
        </div>}
      </Card>

      {/* Filters + Add */}
      <div style={{ display: "flex", gap: 5, marginBottom: 10, alignItems: "center" }}>
        {[{ k: "active", l: "Active", cnt: s.tasks.filter(t => t.status !== "done").length }, { k: "urgent", l: "Urgente", cnt: s.tasks.filter(t => t.prio === "high" && t.status !== "done").length }, { k: "done", l: "Finalizate", cnt: done }].map(f =>
          <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "5px 11px", borderRadius: 14, fontSize: 10, fontWeight: 600, background: filter === f.k ? "var(--g)" : "var(--cr)", color: filter === f.k ? "#fff" : "var(--mt)", border: `1px solid ${filter === f.k ? "var(--g)" : "var(--bd)"}` }}>
            {f.l} <span style={{ opacity: .7 }}>{f.cnt}</span>
          </button>
        )}
        <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: "50%", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
      </div>

      {/* Task list */}
      {list.length === 0 && <EmptyState icon={filter === "done" ? "📋" : "🎉"} title={filter === "done" ? "Nicio sarcină" : "Excelent!"} subtitle={filter === "done" ? "Niciun task finalizat încă" : "Totul e la zi!"} />}

      {list.map((t) => {
        const over = new Date(t.due) < new Date() && t.status !== "done";
        const dn = t.status === "done";
        return (
          <Card key={t.id} style={{ marginBottom: 6, padding: 0, overflow: "hidden", opacity: dn ? .5 : 1 }}>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {/* Checkbox area */}
              <button onClick={() => d({ type: "UPD_TASK", p: { id: t.id, status: dn ? "pending" : "done" } })} style={{ width: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: dn ? "rgba(107,158,104,.08)" : over ? "rgba(184,92,92,.04)" : "transparent", borderRight: "1px solid var(--bd)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${dn ? "var(--ok)" : over ? "var(--er)" : "var(--ft)"}`, background: dn ? "var(--ok)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                  {dn && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </button>
              {/* Content */}
              <div onClick={() => { setEditing(t); setShowForm(true) }} style={{ flex: 1, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textDecoration: dn ? "line-through" : "none", flex: 1, color: "var(--ink)" }}>{t.title}</span>
                  {t.prio === "high" && !dn && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--er)", flexShrink: 0 }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: over ? "var(--er)" : "var(--mt)", fontWeight: over ? 600 : 400 }}>
                    {dn ? "Finalizat ✓" : dueLabel(t.due)}
                  </span>
                  {t.cat && <Badge c="gold">{t.cat}</Badge>}
                  {t.prio === "high" && !dn && <Badge c="red">Urgent</Badge>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare task" : "Task nou"}>
        {showForm && <TaskFormInner task={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
      </Modal>
    </div>
  );
}
function TaskFormInner({ task, onClose }) {
  const { d } = useApp(); const [f, setF] = useState(task ? { ...task } : { title: "", due: "", status: "pending", prio: "medium", cat: "" }); const [showConfirm, setShowConfirm] = useState(false); const u = k => v => setF(x => ({ ...x, [k]: v }));
  return <>
    <Fld label="Titlu" value={f.title} onChange={u("title")} placeholder="Ce trebuie făcut?" />
    <Fld label="Până la data" value={f.due} onChange={u("due")} type="date" />
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} placeholder="Catering, Rochie, General..." />
    <Fld label="Prioritate" value={f.prio} onChange={u("prio")} options={[{ value: "low", label: "Scăzută" }, { value: "medium", label: "Medie" }, { value: "high", label: "Urgentă" }]} />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { d({ type: task ? "UPD_TASK" : "ADD_TASK", p: { ...f, id: task?.id || mkid() } }); onClose() }} disabled={!f.title}>Salvează</Btn>
      {task && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "DEL_TASK", p: task.id }); onClose() }} title="Șterge task-ul?" message={`"${task?.title}" va fi eliminat.`} />
  </>;
}

// ═══════════════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════════════
function VendorsMod() {
  const { s, d } = useApp(); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null); const [expandedId, setExpandedId] = useState(null);
  const stL = { contracted: "Contractat", negotiating: "Negociere", contacted: "Contactat", potential: "Potențial" };
  const stC = { contracted: "green", negotiating: "blue", contacted: "gold", potential: "gray" };
  const stIcon = { contracted: "✅", negotiating: "🤝", contacted: "📩", potential: "🔍" };
  const catIcon = { "Locație": "📍", "Catering": "🍽️", "Fotograf": "📸", "Muzică": "🎵", "Floristică": "💐", "Transport": "🚗", "Altele": "📦" };
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  const contracted = s.vendors.filter(v => v.status === "contracted").length;
  const negotiating = s.vendors.filter(v => v.status === "negotiating").length;

  return (<div className="fu" style={{ padding: "0 14px 20px" }}>
    {/* Summary */}
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--ok)", fontWeight: 500 }}>{contracted}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Contractați</div>
        </div>
        <div style={{ width: 1, background: "var(--bd)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "#5A82B4", fontWeight: 500 }}>{negotiating}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Negociere</div>
        </div>
        <div style={{ width: 1, background: "var(--bd)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--gd)", fontWeight: 500 }}>{s.vendors.length}</div>
          <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase", fontWeight: 700 }}>Total</div>
        </div>
      </div>
    </Card>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Furnizori</span>
      <button onClick={() => { setEditing(null); setShowForm(true) }} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic.plus}</button>
    </div>

    {s.vendors.length === 0 && <Card style={{ padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>📇</div>
      <div style={{ fontSize: 13, color: "var(--mt)" }}>Adaugă primul furnizor</div>
    </Card>}

    {s.vendors.map(v => {
      const isExpanded = expandedId === v.id;
      return (
        <Card key={v.id} style={{ marginBottom: 7, padding: 0, overflow: "hidden" }}>
          <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {catIcon[v.cat] || "📦"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{v.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <Badge c={stC[v.status]}>{stIcon[v.status]} {stL[v.status]}</Badge>
                {v.rating > 0 && <span style={{ fontSize: 10, color: "var(--gd)", fontWeight: 600 }}>{"★".repeat(v.rating)} <span style={{ color: "var(--mt)", fontWeight: 400 }}>{ratingLabels[v.rating]}</span></span>}
              </div>
            </div>
            <span style={{ color: "var(--ft)", transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>{ic.chevD}</span>
          </div>

          {isExpanded && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0" }}>
              {v.cat && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Categorie</span>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{v.cat}</span>
              </div>}
              {v.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Telefon</span>
                <span style={{ fontWeight: 600, color: "var(--gd)" }}>{v.phone}</span>
              </div>}
              {v.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "var(--mt)", minWidth: 70 }}>Email</span>
                <span style={{ fontWeight: 500, color: "var(--ink)" }}>{v.email}</span>
              </div>}
              {v.notes && <div style={{ fontSize: 11, color: "var(--gr)", fontStyle: "italic", padding: "6px 10px", background: "var(--cr)", borderRadius: 8, marginTop: 2 }}>📝 {v.notes}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Btn v="secondary" onClick={() => { setEditing(v); setShowForm(true) }} full style={{ fontSize: 11 }}>{ic.edit} Editează</Btn>
            </div>
          </div>}
        </Card>
      );
    })}
    <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare furnizor" : "Furnizor nou"}>
      {showForm && <VendorFormInner vendor={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </Modal>
  </div>);
}
function VendorFormInner({ vendor, onClose }) {
  const { s, d } = useApp(); const [f, setF] = useState(vendor ? { ...vendor } : { name: "", cat: "Locație", phone: "", email: "", status: "potential", rating: 3, notes: "" }); const u = k => v => setF(x => ({ ...x, [k]: v })); const [showConfirm, setShowConfirm] = useState(false);
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  return <>
    <Fld label="Nume furnizor" value={f.name} onChange={u("name")} placeholder="Numele firmei sau persoanei" />
    <Fld label="Categorie" value={f.cat} onChange={u("cat")} options={["Locație", "Catering", "Fotograf", "Muzică", "Floristică", "Transport", "Altele"]} />
    <Fld label="Status" value={f.status} onChange={u("status")} options={[{ value: "potential", label: "🔍 Potențial" }, { value: "contacted", label: "📩 Contactat" }, { value: "negotiating", label: "🤝 Negociere" }, { value: "contracted", label: "✅ Contractat" }]} />
    <Fld label="Telefon" value={f.phone} onChange={u("phone")} placeholder="+40..." />
    <Fld label="Email" value={f.email} onChange={u("email")} type="email" placeholder="email@furnizor.ro" />
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--mt)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Evaluare: <span style={{ color: "var(--gd)", textTransform: "none" }}>{ratingLabels[f.rating || 0]}</span></label>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => u("rating")(i)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", border: `2px solid ${i <= f.rating ? "var(--g)" : "var(--bd)"}`, background: i <= f.rating ? "rgba(184,149,106,.08)" : "var(--cr)", transition: "all .15s" }}>
            <div style={{ fontSize: 14 }}>{i <= f.rating ? "★" : "☆"}</div>
            <div style={{ fontSize: 8, color: i <= f.rating ? "var(--gd)" : "var(--mt)", fontWeight: 600 }}>{ratingLabels[i]}</div>
          </button>
        ))}
      </div>
    </div>
    <Fld label="Note" value={f.notes} onChange={u("notes")} type="textarea" placeholder="Detalii contract, prețuri, observații..." />
    <div style={{ display: "flex", gap: 8 }}>
      <Btn full onClick={() => { if (vendor) d({ type: "SET", p: { vendors: s.vendors.map(v => v.id === vendor.id ? { ...v, ...f } : v) } }); else d({ type: "SET", p: { vendors: [...s.vendors, { ...f, id: mkid() }] } }); onClose() }} disabled={!f.name}>Salvează</Btn>
      {vendor && <Btn v="danger" onClick={() => setShowConfirm(true)}>{ic.trash}</Btn>}
    </div>
    {vendor && <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => { d({ type: "SET", p: { vendors: s.vendors.filter(v => v.id !== vendor.id) } }); onClose() }} title="Șterge furnizorul?" message={`"${vendor?.name}" va fi eliminat.`} />}
  </>;
}
function VendorsInline() {
  const { s, d } = useApp(); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null);
  const stL = { contracted: "Contractat", negotiating: "Negociere", contacted: "Contactat", potential: "Potențial" };
  const stC = { contracted: "green", negotiating: "blue", contacted: "gold", potential: "gray" };
  const stIcon = { contracted: "✅", negotiating: "🤝", contacted: "📩", potential: "🔍" };
  const catIcon = { "Locație": "📍", "Catering": "🍽️", "Fotograf": "📸", "Muzică": "🎵", "Floristică": "💐", "Transport": "🚗", "Altele": "📦" };
  const ratingLabels = ["", "Slab", "Acceptabil", "Bun", "Foarte bun", "Excelent"];
  return (<>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>{s.vendors.length} furnizori</span>
      <Btn v="secondary" onClick={() => { setEditing(null); setShowForm(true) }} style={{ fontSize: 10, padding: "4px 10px" }}>{ic.plus} Nou</Btn>
    </div>
    {s.vendors.map(v => (
      <Card key={v.id} onClick={() => { setEditing(v); setShowForm(true) }} style={{ marginBottom: 7, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{catIcon[v.cat] || "📦"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{v.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <Badge c={stC[v.status]}>{stIcon[v.status]} {stL[v.status]}</Badge>
              {v.rating > 0 && <span style={{ fontSize: 10, color: "var(--gd)" }}>{"★".repeat(v.rating)} {ratingLabels[v.rating]}</span>}
            </div>
          </div>
        </div>
      </Card>
    ))}
    <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? "Editare" : "Furnizor nou"}>
      {showForm && <VendorFormInner vendor={editing} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </Modal>
  </>);
}

// ═══════════════════════════════════════════════════════════════
// 📥 CSV IMPORT
// ═══════════════════════════════════════════════════════════════
function ImportCSV({ open, onClose }) {
  const { s, d, showToast } = useApp();
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState([]);
  const groups = s.groups || ["Prieteni"];

  const parse = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const guests = [];
    for (const line of lines) {
      // Support: "Name, Group, Dietary" or just "Name"
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[0] && parts[0].length > 1) {
        guests.push({
          id: mkid(),
          name: parts[0],
          group: parts[1] && groups.includes(parts[1]) ? parts[1] : groups[0],
          rsvp: "pending",
          dietary: parts[2] || "",
          tid: null,
          notes: parts[3] || "",
        });
      }
    }
    return guests;
  };

  useEffect(() => { if (raw) setPreview(parse(raw)); else setPreview([]); }, [raw]);

  const doImport = () => {
    if (preview.length === 0) return;
    d({ type: "IMPORT_GUESTS", p: preview });
    showToast?.(`${preview.length} invitați importați!`, "success");
    setRaw("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import invitați">
      <div style={{ fontSize: 12, color: "var(--mt)", marginBottom: 10 }}>
        Lipește lista de invitați, câte un rând per invitat. Format: <b>Nume, Grup, Restricții</b> (doar numele e obligatoriu).
      </div>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder={"Maria Popescu, Familie Mireasă, vegetarian\nIon Ionescu, Familie Mire\nElena Dragomir"} rows={6} style={{ width: "100%", padding: "11px 13px", background: "var(--cr)", border: "1.5px solid var(--bd)", borderRadius: "var(--rs)", fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 10 }} />
      {preview.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
            ✓ {preview.length} invitați detectați
          </div>
          <div style={{ maxHeight: 120, overflow: "auto", borderRadius: "var(--rs)", border: "1px solid var(--bd)" }}>
            {preview.slice(0, 10).map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderTop: i ? "1px solid var(--bd)" : "none", fontSize: 12 }}>
                <span style={{ fontWeight: 600, flex: 1 }}>{g.name}</span>
                <Badge c="gold">{g.group}</Badge>
                {g.dietary && <Badge c="rose">{g.dietary}</Badge>}
              </div>
            ))}
            {preview.length > 10 && <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--mt)" }}>...și încă {preview.length - 10}</div>}
          </div>
        </div>
      )}
      <Btn full onClick={doImport} disabled={preview.length === 0}>Importă {preview.length} invitați</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎉 ONBOARDING WIZARD
// ═══════════════════════════════════════════════════════════════
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [couple, setCouple] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [budget, setBudget] = useState(15000);
  const [guestCount, setGuestCount] = useState(100);

  const steps = [
    { title: "Cine se căsătorește?", sub: "Spune-ne numele mirilor" },
    { title: "Când și unde?", sub: "Data și locul nunții" },
    { title: "Planificarea", sub: "Buget estimat și număr de invitați" },
  ];

  const canNext = step === 0 ? couple.length > 2 : step === 1 ? date : true;

  const finish = () => {
    const tablesCount = Math.ceil(guestCount / 8);
    const tables = Array.from({ length: tablesCount }, (_, i) => ({
      id: mkid(), name: i === 0 ? "Masa Mirilor" : `Masa ${i}`, seats: i === 0 ? 6 : 8, shape: i === 0 ? "rectangular" : "round", notes: "",
    }));
    const defaultBudget = [
      { id: mkid(), cat: "Locație", planned: Math.round(budget * 0.2), spent: 0, vendor: venue, status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Catering", planned: Math.round(budget * 0.35), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Fotograf/Video", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Muzică", planned: Math.round(budget * 0.08), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Floristică", planned: Math.round(budget * 0.07), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Rochie & Costum", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
      { id: mkid(), cat: "Altele", planned: Math.round(budget * 0.1), spent: 0, vendor: "", status: "unpaid", notes: "", payments: [] },
    ];
    const defaultTasks = [
      { id: mkid(), title: "Rezervă locația", due: "", status: "pending", prio: "high", cat: "Locație" },
      { id: mkid(), title: "Alege fotograful", due: "", status: "pending", prio: "medium", cat: "Fotograf" },
      { id: mkid(), title: "Trimite invitațiile", due: "", status: "pending", prio: "high", cat: "Invitații" },
      { id: mkid(), title: "Degustare meniu", due: "", status: "pending", prio: "medium", cat: "Catering" },
      { id: mkid(), title: "Probă rochie", due: "", status: "pending", prio: "medium", cat: "Rochie" },
      { id: mkid(), title: "Alege muzica/DJ", due: "", status: "pending", prio: "low", cat: "Muzică" },
    ];
    onComplete({
      wedding: { couple, date, venue, budget: Number(budget), guestTarget: Math.max(1, Number(guestCount) || 1), program: [], theme: "" },
      groups: ["Familie Mireasă", "Familie Mire", "Prieteni", "Colegi"],
      guests: [], tables, budget: defaultBudget, tasks: defaultTasks, vendors: [],
      onboarded: true, activity: [{ id: mkid(), msg: "Nuntă configurată!", ts: new Date().toISOString() }],
    });
  };

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(155deg,#1A1A1A,#28221C,#1A1A1A)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, background: "radial-gradient(circle,rgba(184,149,106,.12),transparent 70%)", borderRadius: "50%" }} />
      <div style={{ flex: "0 0 auto", padding: "48px 28px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
        <img src={LOGO_SM} alt="Wedify" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 400, color: "var(--gl)", marginBottom: 4 }}>Bine ai venit!</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Hai să configurăm nunta ta în 3 pași simpli</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "20px 0 10px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? "var(--g)" : "rgba(255,255,255,.15)", transition: "all .3s" }} />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(255,255,255,.035)", backdropFilter: "blur(16px)", borderRadius: 18, padding: "28px 20px", border: "1px solid rgba(255,255,255,.05)" }}>
          <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, color: "#fff", textAlign: "center", marginBottom: 4 }}>{steps[step].title}</h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center", marginBottom: 22 }}>{steps[step].sub}</p>

          {step === 0 && (
            <input value={couple} onChange={e => setCouple(e.target.value)} placeholder="Alexandra & Mihai" style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 16, textAlign: "center", fontFamily: "var(--fd)" }} />
          )}

          {step === 1 && <>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "13px 14px", marginBottom: 10, borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} />
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Locul nunții (opțional)" style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 15 }} />
          </>}

          {step === 2 && <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Buget estimat (€)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Câți invitați aștepți (aproximativ)?</label>
              <input type="number" value={guestCount} onChange={e => setGuestCount(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 18, fontFamily: "var(--fd)", textAlign: "center" }} />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center", marginTop: 6 }}>
                Vom genera automat {Math.ceil(guestCount / 8)} mese + categorii buget + task-uri inițiale
              </div>
            </div>
          </>}

          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {step > 0 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 14 }}>Înapoi</button>}
            <button onClick={() => step < 2 ? setStep(step + 1) : finish()} disabled={!canNext} style={{ flex: 1, padding: 14, borderRadius: 12, background: canNext ? "linear-gradient(135deg,var(--g),var(--gd))" : "rgba(255,255,255,.1)", color: canNext ? "#fff" : "rgba(255,255,255,.3)", fontSize: 14, fontWeight: 600, opacity: canNext ? 1 : .5 }}>
              {step < 2 ? "Continuă" : "Începe planificarea →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🧰 TOOLS MODULE — Unelte utile
// ═══════════════════════════════════════════════════════════════
function ToolsMod() {
  const [active, setActive] = useState(null);
  const tools = [
    { k: "menu", l: "Calculator Meniu", icon: "🍽️", desc: "Sumar restricții + cantități catering" },
    { k: "wday", l: "Ziua Nunții", icon: "📋", desc: "Sumar printabil cu tot ce trebuie" },
    { k: "vendors", l: "Furnizori", icon: "📇", desc: "Gestionare și comparare furnizori" },
  ];
  return (
    <div className="fu" style={{ padding: "0 14px 20px" }}>
      {!active && tools.map(t => (
        <Card key={t.k} onClick={() => setActive(t.k)} style={{ marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.l}</div>
            <div style={{ fontSize: 11, color: "var(--mt)" }}>{t.desc}</div>
          </div>
          <span style={{ color: "var(--ft)" }}>{ic.chevD}</span>
        </Card>
      ))}
      {active && <>
        <button onClick={() => setActive(null)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gd)", fontWeight: 600, marginBottom: 12, padding: "4px 0" }}>← Înapoi la Unelte</button>
        {active === "menu" && <MenuCalc />}
        {active === "wday" && <WeddingDay />}
        {active === "vendors" && <VendorsInline />}
      </>}
    </div>
  );
}

// ── SFATURI ORGANIZARE NUNTĂ ──────────────────────────────────
function WeddingTips() {
  const [open, setOpen] = useState(null);
  const tips = [
    { cat: "📍 Locație", items: [
      "Vizitează locația la aceeași oră la care va fi nunta — lumina naturală contează",
      "Întreabă despre planul B în caz de ploaie (terasă acoperită, cort de rezervă)",
      "Verifică dacă locația permite artificii / lampionuri / DJ extern",
      "Negociază pachetul: multe locații includ catering + decor în preț",
      "Rezervă locația cu minim 10-12 luni înainte, mai ales pentru weekend-uri de vară",
    ]},
    { cat: "🍽️ Catering & Meniu", items: [
      "Programează degustarea cu minim 3 firme diferite înainte de a semna",
      "Pune meniu de copii separat (porții mai mici, mâncare simplă)",
      "Comunică TOATE restricțiile alimentare cu 2 săptămâni înainte — nu în ultima zi",
      "Calculează ~120-150g carne + garnituri per persoană pentru bufet",
      "Prevezi 10-15% mai multă mâncare decât numărul final de invitați",
    ]},
    { cat: "📸 Foto & Video", items: [
      "Cere portofoliul complet de nunți (nu doar pozele selectate de fotograf)",
      "Discută lista de poze obligatorii: cuplu, familie, nași, grupuri",
      "Stabilește clar: câte ore, second shooter, album inclus, deadline livrare",
      "Pregătește o prima întâlnire cu fotograful înainte de nuntă (engagement shoot)",
      "Verifică recenziile pe Google/Facebook, nu doar portofoliul de pe site",
    ]},
    { cat: "👗 Ținute & Pregătiri", items: [
      "Comandă rochia cu 6-8 luni înainte — ajustările durează încă 2-3 luni",
      "Fă probă cu pantofii, voalul și accesoriile împreună — nu separat",
      "Costumul mirelui: comandat cu minim 3 luni înainte",
      "Rezervă makeup artist + coafeză cu probă de proba cu 2 luni înainte",
      "Ia o trusă de urgență: ac, ață, plasture, oglindă, spray, șervețele",
    ]},
    { cat: "🎵 Muzică & Atmosferă", items: [
      "DJ vs trupă: DJ-ul e mai flexibil pe genuri, trupa creează energie live",
      "Trimite o playlist cu must-play si never-play cu 2 saptamani inainte",
      "Primul dans: alege piesa cu 2+ luni înainte, exersează minim 3-4 ori",
      "Verifică echipamentul de sunet al locației vs ce aduce DJ-ul",
      "Momentele cheie: intrarea mirilor, primul dans, aruncatul buchetului — discută timing-ul",
    ]},
    { cat: "💐 Floristică & Decor", items: [
      "Alege flori de sezon — sunt mai proaspete și mai ieftine",
      "Cere mockup / schiță a aranjamentelor înainte de ziua nunții",
      "Gândește-te la reutilizare: buchetul miresei → aranjament masă la petrecere",
      "Stabilește cine montează și demontează decorul — și la ce oră",
      "Luminile ambientale (fairy lights, lumânări) fac mai mult decât florile scumpe",
    ]},
    { cat: "💰 Buget & Negocieri", items: [
      "Pune deoparte 10-15% din buget ca fond de urgență — mereu apar extra",
      "Negociază: cere discount la plata integrală sau în avans",
      "Compară mereu 3 oferte pe aceeași categorie (nu doar preț, ci și ce include)",
      "Citește contractul cu atenție: politica de anulare, penalizări, ce e inclus",
      "Ține o evidență a TUTUROR plăților (avans, rate, sold) — nu te baza pe memorie",
    ]},
    { cat: "📋 Ziua Nunții", items: [
      "Desemnează un coordonator de zi — nu tu, nu mirele, cineva dedicat",
      "Printează programul zilei pentru: locație, DJ, fotograf, nași, coordonator",
      "Mănâncă dimineața! Mirii uită mereu și leșină la ceremonie",
      "Pregătește o geantă cu: încărcător, apă, snackuri, aspirină, bani cash",
      "Momentele de liniște: programează 15 min doar voi doi între ceremonie și petrecere",
    ]},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 12, padding: 14, background: "rgba(184,149,106,.04)", border: "1px solid rgba(184,149,106,.15)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 4 }}>💡 Ghid practic</div>
        <div style={{ fontSize: 13, color: "var(--ink)" }}>Sfaturi testate de sute de cupluri. Apasă pe o categorie pentru detalii.</div>
      </Card>
      {tips.map((section, i) => (
        <Card key={i} style={{ marginBottom: 6, padding: 0, overflow: "hidden" }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{section.cat}</span>
            <span style={{ fontSize: 11, color: "var(--mt)", display: "flex", alignItems: "center", gap: 4 }}>{section.items.length} sfaturi <span style={{ transform: open === i ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-flex" }}>{ic.chevD}</span></span>
          </button>
          {open === i && <div style={{ padding: "0 14px 14px" }}>
            {section.items.map((tip, j) => (
              <div key={j} style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: j ? "1px solid var(--bd)" : "none" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(184,149,106,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 9, color: "var(--gd)", fontWeight: 700 }}>{j + 1}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--gr)" }}>{tip}</div>
              </div>
            ))}
          </div>}
        </Card>
      ))}
    </div>
  );
}

// ── CALCULATOR MENIU ────────────────────────────────────────
function MenuCalc() {
  const { s } = useApp();
  const conf = s.guests.filter(g => g.rsvp === "confirmed");
  const pend = s.guests.filter(g => g.rsvp === "pending");

  // Dietary breakdown
  const dietMap = {};
  conf.forEach(g => {
    const d = g.dietary?.trim().toLowerCase();
    if (d) dietMap[d] = (dietMap[d] || 0) + 1;
  });
  const confPpl = sumGuests(conf);
  const pendPpl = sumGuests(pend);
  const standard = confPpl - Object.values(dietMap).reduce((a, b) => a + b, 0);
  const dietList = Object.entries(dietMap).sort((a, b) => b[1] - a[1]);

  // Tag-based counts
  const childCount = conf.filter(g => (g.tags || []).includes("Copil")).reduce((a, g) => a + gCount(g), 0);
  const adultCount = Math.max(confPpl - childCount, 0);

  // Budget per guest — uses total budget, not magic catering lookup
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);
  const wBudget = s.wedding.budget || tP;
  const costPerGuest = confPpl > 0 ? Math.round(wBudget / confPpl) : 0;

  const copyText = () => {
    let txt = `SUMAR MENIU — ${s.wedding.couple}\n${fmtD(s.wedding.date)} · ${s.wedding.venue}\n\n`;
    txt += `TOTAL CONFIRMAȚI: ${conf.length} invitați (${confPpl} persoane)\n`;
    txt += `  Adulți: ${adultCount}\n`;
    if (childCount > 0) txt += `  Copii: ${childCount}\n`;
    txt += `  Standard (fără restricții): ${standard}\n\n`;
    if (dietList.length > 0) {
      txt += `RESTRICȚII ALIMENTARE:\n`;
      dietList.forEach(([d, c]) => { txt += `  ${d.charAt(0).toUpperCase() + d.slice(1)}: ${c} ${c === 1 ? "persoană" : "persoane"}\n`; });
    }
    txt += `\nÎN AȘTEPTARE: ${pend.length} invitați (posibil +${pendPpl} persoane)\n`;
    txt += `\nBUGET TOTAL: ${fmtC(wBudget)}\n`;
    txt += `COST/INVITAT: ~${fmtC(costPerGuest)}\n`;
    navigator.clipboard?.writeText(txt);
  };

  return (
    <div>
      <Card style={{ marginBottom: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Sumar pentru catering</div>
          <Btn v="secondary" onClick={copyText} style={{ fontSize: 10, padding: "5px 10px" }}>📋 Copiază</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ textAlign: "center", padding: "10px 0", background: "rgba(107,158,104,.06)", borderRadius: "var(--rs)" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--ok)", fontWeight: 500 }}>{conf.length}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase" }}>confirmați</div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 0", background: "rgba(184,149,106,.06)", borderRadius: "var(--rs)" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--g)", fontWeight: 500 }}>{adultCount}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase" }}>adulți</div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 0", background: "rgba(90,130,180,.06)", borderRadius: "var(--rs)" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "#5A82B4", fontWeight: 500 }}>{childCount}</div>
            <div style={{ fontSize: 10, color: "var(--mt)", textTransform: "uppercase" }}>copii</div>
          </div>
        </div>

        {/* Dietary breakdown */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gd)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Restricții alimentare</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ok)" }} />
            <span style={{ flex: 1, fontSize: 13 }}>Standard (fără restricții)</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ok)" }}>{standard}</span>
          </div>
          {dietList.map(([d, c]) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--er)" }} />
              <span style={{ flex: 1, fontSize: 13, textTransform: "capitalize" }}>{d}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--er)" }}>{c}</span>
            </div>
          ))}
          {dietList.length === 0 && <div style={{ fontSize: 12, color: "var(--mt)", fontStyle: "italic" }}>Nicio restricție alimentară înregistrată</div>}
        </div>

        {/* Pending warning */}
        {pend.length > 0 && <div style={{ padding: "8px 12px", borderRadius: "var(--rs)", background: "rgba(201,160,50,.06)", border: "1px solid rgba(201,160,50,.15)", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--wn)", fontWeight: 600 }}>⚠ {pend.length} invitați în așteptare</div>
          <div style={{ fontSize: 11, color: "var(--mt)" }}>Planifică cu o marjă de +{pend.length} persoane</div>
        </div>}

        {/* Cost estimate */}
        <div style={{ padding: "10px 12px", borderRadius: "var(--rs)", background: "var(--cr)", border: "1px solid var(--bd)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--mt)" }}>Buget total nuntă</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gd)" }}>{fmtC(wBudget)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--mt)" }}>Cost per invitat (total)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--g)" }}>~{fmtC(costPerGuest)}</span>
          </div>
        </div>
      </Card>

      {/* Per-group breakdown */}
      <Card style={{ padding: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 8 }}>Per grup</div>
        {(() => {
          const gs = {};
          conf.forEach(g => { const k = g.group || "Altele"; if (!gs[k]) gs[k] = { total: 0, diet: 0, kids: 0 }; gs[k].total++; if (g.dietary) gs[k].diet++; if ((g.tags || []).includes("Copil")) gs[k].kids++; });
          return Object.entries(gs).map(([name, v]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{name}</span>
              <Badge c="green">{v.total}</Badge>
              {v.diet > 0 && <Badge c="rose">{v.diet} restricții</Badge>}
              {v.kids > 0 && <Badge c="blue">{v.kids} copii</Badge>}
            </div>
          ));
        })()}
      </Card>
    </div>
  );
}

// ── CHECKLIST INTELIGENT ─────────────────────────────────────
function SmartChecklist() {
  const { s, d } = useApp();
  const wDate = new Date(s.wedding.date);
  const now = new Date();
  const days = Math.max(0, Math.ceil((wDate - now) / 864e5));
  const months = Math.round(days / 30);
  const conf = s.guests.filter(g => g.rsvp === "confirmed").length;
  const unseated = s.guests.filter(g => !g.tid && g.rsvp === "confirmed").length;
  const tP = s.budget.reduce((a, b) => a + b.planned, 0);
  const tS = s.budget.reduce((a, b) => a + b.spent, 0);

  const [addedTips, setAddedTips] = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());

  const suggestions = useMemo(() => {
    const tips = [];
    const taskTitles = s.tasks.map(t => t.title.toLowerCase().trim());
    const isCovered = (tipTitle) => {
      const tl = tipTitle.toLowerCase().trim();
      if (taskTitles.includes(tl)) return true;
      const words = tl.split(/\s+/).filter(w => w.length > 3);
      return taskTitles.some(tt => words.filter(w => tt.includes(w)).length >= 2);
    };

    if (unseated > 0) tips.push({ id: "alert_seats", t: "Alocă " + unseated + " invitați la mese", cat: "Mese", p: "high", why: unseated + " confirmați nu au loc alocat", alert: true });
    if (tS < tP && s.budget.length > 0) tips.push({ id: "alert_pay", t: "Verifică plățile restante (" + fmtC(tP - tS) + ")", cat: "Buget", p: months < 2 ? "high" : "medium", why: "Buget neplătit", alert: true });
    if (s.guests.length === 0) tips.push({ id: "alert_guests", t: "Adaugă primii invitați", cat: "Invitații", p: "high", why: "Lista e goală", alert: true });

    const add = (id, t, cat, p, why) => { if (!tips.some(x => x.id === id)) tips.push({ id, t, cat, p, why }); };

    if (months >= 8) {
      add("s_loc", "Rezervă locația nunții", "Locație", "high", "Se rezervă cu 1 an înainte");
      add("s_foto", "Alege fotograful", "Fotograf", "medium", "Cei buni au agenda plină");
      add("s_buget", "Stabilește bugetul detaliat", "Buget", "high", "Toate deciziile depind de el");
    }
    if (months >= 5 && months <= 8) {
      add("s_dj", "Contactează DJ/trupă", "Muzică", "medium", "Se rezervă repede");
      add("s_flor", "Contactează floristul", "Floristică", "low", "Discută sezonalitatea");
      add("s_cat", "Contactează firme de catering", "Catering", "high", "Compară 3 oferte");
      add("s_inv", "Trimite invitațiile", "Invitații", "high", "Dă 2 luni să răspundă");
    }
    if (months >= 2 && months <= 5) {
      add("s_roch", "Probă rochie + costum", "Ținute", "high", "Ajustările durează");
      add("s_tort", "Comandă tortul", "Catering", "medium", "Design personalizat");
      add("s_menu", "Confirmă meniul final", "Catering", "high", conf + " confirmați");
      add("s_prog", "Pregătește programul zilei", "General", "medium", "Coordonează cu MC");
    }
    if (days > 0 && days <= 45) {
      add("s_vfin", "Confirmare finală furnizori", "General", "high", "Sună pe toți");
      add("s_plic", "Pregătește plicuri + daruri nași", "General", "medium", "Tradiție");
      add("s_pfin", "Probă finală rochie/costum", "Ținute", "high", "Ultima ajustare");
      add("s_pmese", "Printează planul meselor", "Mese", "medium", "Pentru staff locație");
    }

    return tips.filter(tip => !isCovered(tip.t) && !addedTips.has(tip.id) && !dismissed.has(tip.id));
  }, [s.tasks, s.guests, s.budget, months, days, conf, unseated, tP, tS, addedTips, dismissed]);

  const addTip = (tip) => {
    d({ type: "ADD_TASK", p: { id: mkid(), title: tip.t, due: "", status: "pending", prio: tip.p, cat: tip.cat } });
    setAddedTips(prev => new Set([...prev, tip.id]));
  };

  const dismiss = (tipId) => {
    setDismissed(prev => new Set([...prev, tipId]));
  };

  const periodLabel = months >= 8 ? "Planificare timpurie (8+ luni)" : months >= 5 ? "Pregătire activă (5-8 luni)" : months >= 2 ? "Finalizare (2-5 luni)" : days > 0 ? "Ultimele pregătiri!" : "Ziua cea mare!";
  const alerts = suggestions.filter(t => t.alert);
  const recs = suggestions.filter(t => !t.alert);

  return (
    <div>
      {/* Header explicativ */}
      <Card style={{ marginBottom: 12, padding: 14, background: "rgba(184,149,106,.04)", border: "1px solid rgba(184,149,106,.15)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6 }}>🧠 Cum funcționează</div>
        <div style={{ fontSize: 12, color: "var(--gr)", lineHeight: 1.6 }}>
          Analizăm progresul nunții tale și sugerăm ce ai de făcut. Apasă <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "1px 6px", borderRadius: 4, background: "var(--ok)", color: "#fff", fontSize: 10, fontWeight: 700 }}>✓ Adaugă</span> pentru a transforma o sugestie în task, sau <span style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 4, background: "var(--cr2)", fontSize: 10, fontWeight: 600, color: "var(--mt)" }}>Nu e cazul</span> pentru a o ascunde.
        </div>
      </Card>

      {/* Status bar */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>Perioada</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gd)" }}>{periodLabel}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--g)" }}>{days}</div>
            <div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>zile rămase</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--mt)" }}>
          <span>{s.tasks.filter(t => t.status === "done").length}/{s.tasks.length} tasks gata</span>
          <span>·</span>
          <span>{conf}/{s.guests.length} confirmați</span>
          <span>·</span>
          <span>{suggestions.length} sugestii</span>
        </div>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && <>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--er)", marginBottom: 6, paddingLeft: 2 }}>⚡ Necesită atenție</div>
        {alerts.map(tip => (
          <Card key={tip.id} style={{ marginBottom: 6, padding: "10px 14px", border: "1.5px solid rgba(184,92,92,.2)", background: "rgba(184,92,92,.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(184,92,92,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11 }}>⚡</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.t}</div>
                <div style={{ fontSize: 10, color: "var(--mt)" }}>{tip.why}</div>
              </div>
            </div>
          </Card>
        ))}
        <div style={{ height: 12 }} />
      </>}

      {/* Recommendations */}
      {recs.length > 0 && <>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gd)", marginBottom: 6, paddingLeft: 2 }}>📋 Sugestii pentru tine</div>
        {recs.map(tip => (
          <Card key={tip.id} style={{ marginBottom: 6, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: tip.p === "high" ? "rgba(184,92,92,.1)" : "rgba(184,149,106,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 10 }}>{tip.p === "high" ? "🔴" : tip.p === "medium" ? "🟡" : "🟢"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.t}</div>
                <div style={{ fontSize: 11, color: "var(--mt)", marginTop: 1 }}>{tip.why}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <Badge c="gold">{tip.cat}</Badge>
                  {tip.p === "high" && <Badge c="red">Urgent</Badge>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--bd)" }}>
              <button onClick={() => addTip(tip)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "var(--ok)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                ✓ Adaugă la Tasks
              </button>
              <button onClick={() => dismiss(tip.id)} style={{ padding: "7px 14px", borderRadius: 8, background: "var(--cr2)", color: "var(--mt)", fontSize: 11, fontWeight: 600 }}>
                Nu e cazul
              </button>
            </div>
          </Card>
        ))}
      </>}

      {/* All clear */}
      {suggestions.length === 0 && <Card style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Totul e în regulă!</div>
        <div style={{ fontSize: 12, color: "var(--mt)" }}>Toate sugestiile sunt acoperite sau adăugate la tasks.</div>
        {dismissed.size > 0 && <button onClick={() => setDismissed(new Set())} style={{ marginTop: 10, fontSize: 11, color: "var(--gd)", fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: "rgba(184,149,106,.06)" }}>Arată sugestiile ascunse ({dismissed.size})</button>}
      </Card>}
    </div>
  );
}

// ── ZIUA NUNȚII — Dashboard editabil + printabil ─────────────
function WeddingDay() {
  const { s, d } = useApp();
  const conf = s.guests.filter(g => g.rsvp === "confirmed");
  const dietMap = {};
  conf.forEach(g => { if (g.dietary?.trim()) { const k = g.dietary.trim().toLowerCase(); dietMap[k] = (dietMap[k] || 0) + 1 } });
  const keyContacts = s.vendors.filter(v => v.status === "contracted");
  const nasi = s.guests.filter(g => (g.tags || []).some(t => ["Naș/Nașă", "Martor"].includes(t)));

  const defaultProg = [
    { time: "14:00", ev: "Cununia civilă" }, { time: "15:00", ev: "Cununia religioasă" },
    { time: "16:00", ev: "Ședință foto" }, { time: "17:00", ev: "Sosirea invitaților" },
    { time: "17:30", ev: "Cocktail & aperitive" }, { time: "18:30", ev: "Intrarea mirilor" },
    { time: "19:00", ev: "Cina" }, { time: "20:30", ev: "Primul dans" },
    { time: "21:00", ev: "Petrecere & tort" }, { time: "00:00", ev: "Aruncatul buchetului" },
  ];
  const [prog, setProg] = useState(() => s.weddingDayProgram || defaultProg);
  const [editIdx, setEditIdx] = useState(-1);
  const [addMode, setAddMode] = useState(false);
  const [nt, setNt] = useState(""); const [ne, setNe] = useState("");
  const progChanged = useRef(false);

  // Only save when user actually modifies (not on initial render)
  const updateProg = (newProg) => { setProg(newProg); progChanged.current = true; };
  useEffect(() => { if (progChanged.current) { d({ type: "SET", p: { weddingDayProgram: prog } }); progChanged.current = false; } }, [prog]);

  const addItem = () => { if (!nt || !ne.trim()) return; updateProg([...prog, { time: nt, ev: ne.trim() }].sort((a, b) => a.time.localeCompare(b.time))); setNt(""); setNe(""); setAddMode(false); };
  const delItem = (i) => updateProg(prog.filter((_, j) => j !== i));
  const updItem = (i, k, v) => updateProg(prog.map((p, j) => j === i ? { ...p, [k]: v } : p));

  const printDay = () => {
    let h = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ziua Nunții — ${s.wedding.couple}</title>
    <style>body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a1a;max-width:700px;margin:0 auto}h1{font-family:Georgia,serif;font-size:26px;color:#8A6D47;margin-bottom:2px}.sub{color:#999;font-size:12px;margin-bottom:28px}h2{font-size:15px;color:#8A6D47;margin:22px 0 8px;border-bottom:1px solid #E5DFD5;padding-bottom:5px}.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F0EAE0;font-size:13px}.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:rgba(184,149,106,.1);color:#8A6D47;margin:2px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;color:#999;text-transform:uppercase;padding:4px 8px;border-bottom:2px solid #E5DFD5}td{padding:6px 8px;border-bottom:1px solid #F0EAE0;font-size:12px}.footer{margin-top:30px;text-align:center;font-size:10px;color:#ccc}@media print{body{padding:20px}}</style></head><body>
    <h1>Ziua Nunții</h1><div class="sub">${s.wedding.couple} · ${fmtD(s.wedding.date)} · ${s.wedding.venue}</div>
    <h2>Program</h2>`;
    prog.forEach(p => { h += `<div class="row"><b>${p.time}</b><span>${p.ev}</span></div>`; });
    h += `<h2>Cifre</h2><div class="row"><span>Confirmați</span><b>${conf.length}</b></div><div class="row"><span>Mese</span><b>${s.tables.length}</b></div>`;
    if (Object.keys(dietMap).length) { h += `<h2>Restricții alimentare</h2>`; Object.entries(dietMap).forEach(([k,v])=>{ h += `<div class="row"><span style="text-transform:capitalize">${k}</span><b>${v}</b></div>`; }); }
    if (nasi.length) { h += `<h2>Nași & Martori</h2>`; nasi.forEach(g => { h += `<div class="row"><span>${g.name}</span><span class="badge">${(g.tags||[]).find(t=>["Naș/Nașă","Martor"].includes(t))}</span></div>`; }); }
    if (keyContacts.length) { h += `<h2>Contacte furnizori</h2><table><tr><th>Furnizor</th><th>Categorie</th><th>Telefon</th></tr>`; keyContacts.forEach(v => { h += `<tr><td><b>${v.name}</b></td><td>${v.cat}</td><td>${v.phone||"—"}</td></tr>`; }); h += `</table>`; }
    h += `<h2>Plan mese</h2>`;
    s.tables.forEach(t => { const seated = s.guests.filter(g => g.tid === t.id); h += `<div style="margin-bottom:10px"><b>${t.name}</b> (${seated.length}/${t.seats})<br/>`; seated.forEach(g => { h += `<span class="badge">${g.name}${g.dietary?" ⚠":""}</span> `; }); if(!seated.length) h += `<span style="color:#ccc;font-size:12px">Goală</span>`; h += `</div>`; });
    h += `<div class="footer">Generat de Wedify · ${new Date().toLocaleDateString("ro-RO")}</div></body></html>`;
    const w = window.open("", "_blank"); if (w) { w.document.write(h); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 500 }}>Ziua Nunții</div>
          <div style={{ fontSize: 11, color: "var(--mt)" }}>{fmtD(s.wedding.date)} · {s.wedding.venue}</div>
        </div>
        <Btn v="secondary" onClick={printDay} style={{ fontSize: 11, padding: "7px 14px" }}>🖨️ Printează</Btn>
      </div>

      {/* Key numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--ok)" }}>{conf.length}</div><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>invitați</div></Card>
        <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--g)" }}>{s.tables.length}</div><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>mese</div></Card>
        <Card style={{ padding: "10px 8px", textAlign: "center" }}><div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "#5A82B4" }}>{keyContacts.length}</div><div style={{ fontSize: 9, color: "var(--mt)", textTransform: "uppercase" }}>furnizori</div></Card>
      </div>

      {/* EDITABLE PROGRAM */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)" }}>🕐 Programul zilei</div>
          <button onClick={() => setAddMode(!addMode)} style={{ fontSize: 10, fontWeight: 600, color: "var(--g)", padding: "3px 8px", borderRadius: 8, background: "rgba(184,149,106,.08)" }}>{addMode ? "✕ Anulează" : "+ Adaugă"}</button>
        </div>
        {addMode && <div style={{ display: "flex", gap: 6, marginBottom: 10, padding: 8, background: "var(--cr)", borderRadius: "var(--rs)" }}>
          <input type="time" value={nt} onChange={e => setNt(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 12, width: 90 }} />
          <input value={ne} onChange={e => setNe(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Eveniment..." style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--cd)", fontSize: 12 }} />
          <button onClick={addItem} disabled={!nt || !ne.trim()} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--g)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: nt && ne.trim() ? 1 : .4 }}>{ic.plus}</button>
        </div>}
        {prog.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 1, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "var(--g)" : "var(--ft)", flexShrink: 0 }} />
              {i < prog.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 14, background: "var(--bd)" }} />}
            </div>
            {editIdx === i ? <div style={{ flex: 1, display: "flex", gap: 4, paddingBottom: 5 }}>
              <input type="time" value={p.time} onChange={e => updItem(i, "time", e.target.value)} style={{ padding: "3px 6px", borderRadius: 6, border: "1px solid var(--g)", fontSize: 11, width: 80, background: "var(--cd)" }} />
              <input value={p.ev} onChange={e => updItem(i, "ev", e.target.value)} style={{ flex: 1, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--g)", fontSize: 11, background: "var(--cd)" }} />
              <button onClick={() => setEditIdx(-1)} style={{ fontSize: 10, color: "var(--ok)", fontWeight: 700, padding: "0 4px" }}>✓</button>
            </div> : <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, paddingBottom: 5 }}>
              <span style={{ fontSize: 11, color: "var(--gd)", fontWeight: 700, minWidth: 38 }}>{p.time}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{p.ev}</span>
              <button onClick={() => setEditIdx(i)} style={{ padding: 2, color: "var(--mt)", opacity: .5 }}>{ic.edit}</button>
              <button onClick={() => delItem(i)} style={{ padding: 2, color: "var(--ft)", opacity: .5 }}>{ic.x}</button>
            </div>}
          </div>
        ))}
      </Card>

      {/* Nași */}
      {nasi.length > 0 && <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>👑 Nași & Martori</div>
        {nasi.map(g => (
          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--cr2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gd)" }}>{g.name[0]}</div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{g.name}</span>
            <Badge c="gold">{(g.tags || []).find(t => ["Naș/Nașă", "Martor"].includes(t))}</Badge>
          </div>
        ))}
      </Card>}

      {/* Contacte furnizori */}
      {keyContacts.length > 0 && <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>📞 Contacte furnizori</div>
        {keyContacts.map(v => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
            <span style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</span><span style={{ fontSize: 11, color: "var(--mt)", marginLeft: 6 }}>{v.cat}</span></span>
            {v.phone && <span style={{ fontSize: 12, color: "var(--gd)", fontWeight: 500 }}>{v.phone}</span>}
          </div>
        ))}
      </Card>}

      {/* Restricții */}
      {Object.keys(dietMap).length > 0 && <Card>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mt)", marginBottom: 6 }}>⚠ Restricții alimentare</div>
        {Object.entries(dietMap).map(([k, c]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--bd)" }}>
            <span style={{ fontSize: 12, textTransform: "capitalize" }}>{k}</span>
            <Badge c="rose">{c} pers.</Badge>
          </div>
        ))}
      </Card>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP (Supabase Production)
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [s, dispatch] = useReducer(reducer, INITIAL_DATA);
  const [tab, setTab] = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [theme, setTheme] = useState("light");
  const [authUser, setAuthUser] = useState(null); // Supabase auth user
  const [authLoading, setAuthLoading] = useState(true); // checking session
  const [dataLoading, setDataLoading] = useState(false);
  const [weddingId, setWeddingId] = useState(null);

  // ── Check Supabase session on mount ──
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setAuthLoading(false); return; }

    // Get current session
    sb.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
      setAuthLoading(false);
    });

    // Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      if (event === 'SIGNED_OUT') {
        dispatch({ type: "SET", p: { ...DATA, onboarded: false } });
        setWeddingId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load data from Supabase when user logs in ──
  useEffect(() => {
    if (!authUser) return;
    setDataLoading(true);
    loadAllData(authUser.id).then(data => {
      if (data) {
        dispatch({ type: "SET", p: data });
        setWeddingId(data.weddingId);
      }
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, [authUser]);

  // ── Sync reducer actions to Supabase ──
  const d = (action) => {
    dispatch(action);
    // Fire & forget DB sync
    const wid = weddingId;
    if (!wid) return;
    const p = action.p;
    switch (action.type) {
      case "SET":
        if (p.wedding) dbSync.updateWedding(wid, { ...p.wedding, groups: p.groups, tags: p.tags, onboarded: p.onboarded });
        break;
      case "ADD_GUEST": dbSync.addGuest(wid, p).then(row => { if (row) dispatch({ type: "UPD_GUEST", p: { id: p.id, ...row, tid: row.table_id } }); }); break;
      case "UPD_GUEST": dbSync.updateGuest(p.id, p); break;
      case "DEL_GUEST": dbSync.deleteGuest(p); break;
      case "IMPORT_GUESTS": dbSync.bulkInsertGuests(wid, p).then(rows => { if (rows.length) { const mapped = rows.map(r => ({ ...r, tid: r.table_id })); dispatch({ type: "SET_GUESTS_IMPORTED", p: mapped }); } }); break;
      case "ADD_TABLE": dbSync.addTable(wid, p).then(row => { if (row) dispatch({ type: "UPD_TABLE", p: { id: p.id, ...row } }); }); break;
      case "UPD_TABLE": dbSync.updateTable(p.id, p); break;
      case "DEL_TABLE": dbSync.deleteTable(p); break;
      case "REORDER_TABLES": break;
      case "ADD_BUDGET": dbSync.addBudgetItem(wid, { ...p, notes: serializeBudgetNotes(p.notes, p.payments) }).then(row => { if (row) { const parsed = parseBudgetNotes(row.notes || ""); dispatch({ type: "UPD_BUDGET", p: { id: p.id, ...row, cat: row.category, notes: parsed.cleanNotes, payments: parsed.payments || [] } }); } }); break;
      case "UPD_BUDGET": dbSync.updateBudgetItem(p.id, { ...p, notes: serializeBudgetNotes(p.notes, p.payments) }); break;
      case "DEL_BUDGET": dbSync.deleteBudgetItem(p); break;
      case "ADD_TASK": dbSync.addTask(wid, p).then(row => { if (row) dispatch({ type: "UPD_TASK", p: { id: p.id, ...row, prio: row.priority } }); }); break;
      case "UPD_TASK": dbSync.updateTask(p.id, p); break;
      case "DEL_TASK": dbSync.deleteTask(p); break;
      case "ADD_VENDOR": dbSync.addVendor(wid, p).then(row => { if (row) dispatch({ type: "UPD_VENDOR", p: { id: p.id, ...row } }); }); break;
      case "UPD_VENDOR": dbSync.updateVendor(p.id, p); break;
      case "DEL_VENDOR": dbSync.deleteVendor(p); break;
      case "SEAT": dbSync.updateGuest(p.guestId, { tid: p.tableId }); break;
      case "UNSEAT": dbSync.updateGuest(p, { tid: null }); break;
    }
  };

  const user = authUser ? { email: authUser.email, name: authUser.user_metadata?.name || authUser.email.split("@")[0], role: "admin" } : null;

  // Load theme
  useEffect(() => { loadTheme().then(t => { if (t) setTheme(t); }); }, []);
  useEffect(() => { saveTheme(theme); }, [theme]);

  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  // Setup CSS + viewport
  useEffect(() => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    let m = document.querySelector('meta[name="viewport"]'); if (!m) { m = document.createElement("meta"); m.name = "viewport"; document.head.appendChild(m) }; m.content = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    setTimeout(() => setReady(true), 50);
    return () => document.head.removeChild(st);
  }, []);

  // Dark theme cascade
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#1A1816" : "#FFFDF8";
    document.body.style.color = theme === "dark" ? "#E8E0D6" : "#1A1A1A";
  }, [theme]);

  // ── Loading screen ──
  if (authLoading || dataLoading) {
    return (
      <div style={{ minHeight: "100svh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 12% 8%,rgba(184,149,106,.16),transparent 35%), radial-gradient(circle at 86% 90%,rgba(184,149,106,.14),transparent 40%), linear-gradient(155deg,#171513,#241E19,#171513)", padding: "24px 18px", boxSizing: "border-box", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 420 }}>
          <img src={LOGO_SM} alt="Wedify" style={{ width: "min(54vw, 220px)", height: "min(54vw, 220px)", objectFit: "contain", marginBottom: 22, filter: "drop-shadow(0 10px 24px rgba(0,0,0,.48))" }} />
          <div style={{ width: 34, height: 34, border: "2px solid rgba(184,149,106,.28)", borderTopColor: "var(--g)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          <p style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,.72)", letterSpacing: ".02em" }}>Se încarcă...</p>
        </div>
      </div>
    );
  }

  // ── Not logged in → Auth Screen ──
  if (!authUser) {
    return <AuthScreen onLogin={() => {}} />;
  }

  // ── Onboarding (user exists but wedding not configured) ──
  if (!s.onboarded) {
    return <Onboarding onComplete={async (data) => {
      // Save onboarding data to Supabase
      if (weddingId) {
        await dbSync.updateWedding(weddingId, {
          couple: data.wedding.couple, date: data.wedding.date,
          venue: data.wedding.venue, budget: data.wedding.budget,
          groups: data.groups, onboarded: true,
        });
        // Bulk insert tables, budget, tasks
        const dbTables = await dbSync.bulkInsertTables(weddingId, data.tables);
        const dbBudget = await dbSync.bulkInsertBudget(weddingId, data.budget);
        const dbTasks = await dbSync.bulkInsertTasks(weddingId, data.tasks);
        // Reload all from DB to get real IDs
        const fresh = await loadAllData(authUser.id);
        if (fresh) { dispatch({ type: "SET", p: fresh }); setWeddingId(fresh.weddingId); }
      } else {
        d({ type: "SET", p: data });
      }
    }} />;
  }

  const overdueCount = s.tasks.filter(t => new Date(t.due) < new Date() && t.status !== "done").length;

  const titles = { home: "Dashboard", guests: "Invitați", tables: "Aranjare Mese", budget: "Buget", tasks: "Timeline", tools: "Unelte" };

  return (
    <AppContext.Provider value={{ s, d, user, setShowSettings, showToast, theme, setTheme, setTab, activeTab: tab }}>
      <div data-theme={theme} style={{ width: "100%", maxWidth: 460, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--ink)", opacity: ready ? 1 : 0, transition: "opacity .3s" }}>
        <Header title={titles[tab]} onOpenSettings={() => setShowSettings(true)} />

        <main style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", paddingTop: 12, paddingBottom: "calc(var(--nv) + 20px)" }}>
          {tab === "home" && <Home />}
          {tab === "guests" && <Guests />}
          {tab === "tables" && <TablesList />}
          {tab === "budget" && <BudgetMod />}
          {tab === "tasks" && <TasksMod />}
          {tab === "tools" && <ToolsMod />}
        </main>

        <TabBar overdueCount={overdueCount} />

        <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast(x => ({ ...x, visible: false }))} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </AppContext.Provider>
  );
}
