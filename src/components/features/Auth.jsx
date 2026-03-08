import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase-client";
import { Btn } from "../ui/Btn";

function Auth(){
  const[mode,setMode]=useState("login"); // login | register | forgot | confirm | reset_code | reset_done
  const[email,setEmail]=useState("");
  const[name,setName]=useState("");
  const[pass,setPass]=useState("");
  const[pass2,setPass2]=useState("");
  const[err,setErr]=useState("");
  const[otp,setOtp]=useState("");
  const[newPass,setNewPass]=useState("");
  const[newPass2,setNewPass2]=useState("");
  const[loading,setLoading]=useState(false);
  const[ready,setReady]=useState(false);
  const[acceptStorage,setAcceptStorage]=useState(false);
  const[showInfo,setShowInfo]=useState(false);
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
    if(!acceptStorage)return setErr("Trebuie să fii de acord cu stocarea datelor.");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server.");}
    const{error}=await sb.auth.signUp({
      email:e,password:pass,
      options:{data:{name:n,data_consent:true,consent_date:new Date().toISOString()},emailRedirectTo:`${window.location.origin}/auth/callback?type=signup`}
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
    const{error}=await sb.auth.resetPasswordForEmail(e);
    setLoading(false);
    if(error)return setErr(error.message);
    setMode("reset_code");
  };

  const doResetWithCode=async()=>{
    setErr("");
    if(!otp||otp.trim().length<6)return setErr("Introdu codul din email");
    if(newPass.length<6)return setErr("Parola nouă: minim 6 caractere");
    if(newPass!==newPass2)return setErr("Parolele nu coincid");
    setLoading(true);
    const sb=getSupabase();
    if(!sb){setLoading(false);return setErr("Eroare configurare server.");}

    const rawOtp = otp.trim();
    let verifyError = null;

    // OTP ({{ .Token }}) flow for recovery emails
    if (!rawOtp.includes("token_hash=")) {
      const { error } = await sb.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: rawOtp,
        type: "recovery",
      });
      verifyError = error;
    } else {
      // Link/token_hash ({{ .ConfirmationURL }}) fallback for projects still using link templates
      try {
        const parsed = new URL(rawOtp);
        const tokenHash = parsed.searchParams.get("token_hash");
        const type = parsed.searchParams.get("type") || "recovery";
        if (!tokenHash) {
          setLoading(false);
          return setErr("Link invalid. Verifică emailul și copiază linkul complet.");
        }
        const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
        verifyError = error;
      } catch {
        setLoading(false);
        return setErr("Format cod/link invalid.");
      }
    }

    if(verifyError){
      setLoading(false);
      if(verifyError.message.includes("expired"))return setErr("Codul a expirat. Solicită un nou cod.");
      if(verifyError.message.includes("invalid"))return setErr("Cod sau link invalid. Verifică emailul și încearcă din nou.");
      return setErr(verifyError.message);
    }

    const { error: updateError } = await sb.auth.updateUser({
      password: newPass,
    });

    setLoading(false);
    if(updateError)return setErr(updateError.message);

    await sb.auth.signOut();
    setMode("reset_done");
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
          <img src="/wedify-logo.png" alt="Wedify" style={{width:180,height:"auto",borderRadius:0}} onError={(e)=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.remove("hidden");}} /><span className="hidden" style={{color:"#fff",fontFamily:"var(--fd)",fontSize:28,fontWeight:500}}>Wedify</span>
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
              <button onClick={()=>{setMode("register");setErr("");setPass("");setPass2("");setAcceptStorage(false);}} style={{fontSize:12,color:"var(--gl)",opacity:.9,fontWeight:600}}>Creează cont →</button>
            </div>
          </>}

          {mode==="register"&&<>
            <button onClick={()=>{setMode("login");setErr("");setAcceptStorage(false);}} style={{color:"var(--gl)",fontSize:12,marginBottom:12,opacity:.7}}>← Conectare</button>
            <h2 style={{fontFamily:"var(--fd)",fontSize:20,color:"#fff",textAlign:"center",marginBottom:16}}>Creare cont</h2>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Numele tău complet" type="text" style={inp} autoComplete="name"/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inp} autoComplete="email"/>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Parolă (min 6 caractere)" type="password" style={inp} autoComplete="new-password"/>
            <input value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doRegister()} placeholder="Confirmă parola" type="password" style={inp} autoComplete="new-password"/>
            <label style={{ display:"flex", alignItems:"flex-start", gap:8, marginTop:4, marginBottom:12, cursor:"pointer" }}>
              <input
                type="checkbox"
                checked={acceptStorage}
                onChange={e=>setAcceptStorage(e.target.checked)}
                style={{ marginTop:3, accentColor:"var(--g)", flexShrink:0 }}
              />
              <span style={{ fontSize:12, color:"rgba(255,255,255,.5)", lineHeight:1.5 }}>
                Sunt de acord ca datele mele să fie stocate pentru funcționarea aplicației.
                Poți șterge totul oricând.{" "}
                <button
                  type="button"
                  onClick={(e)=>{e.preventDefault();setShowInfo(true)}}
                  style={{ color:"var(--gl)", textDecoration:"underline", fontSize:12 }}
                >
                  Află mai multe
                </button>
              </span>
            </label>
            {err&&<div style={{padding:"8px 12px",borderRadius:10,marginBottom:10,background:"rgba(184,92,92,.12)",color:"#E88",fontSize:12,animation:"shake .3s"}}>{err}</div>}
            <button onClick={doRegister} disabled={loading||!acceptStorage} style={{...mBtn,opacity:!acceptStorage?0.4:1}}>{loading&&spin}Creează contul</button>
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
            <button onClick={doForgot} disabled={loading} style={mBtn}>{loading&&spin}Trimite cod de resetare</button>
          </>}

          {mode === "reset_code" && <>
            <button onClick={() => { setMode("forgot"); setErr(""); setOtp(""); setNewPass(""); setNewPass2(""); }} style={{ color: "var(--gl)", fontSize: 12, marginBottom: 12, opacity: .7 }}>← Înapoi</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔑</div>
              <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, color: "#fff", marginBottom: 8 }}>Verificare cod</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 6 }}>Am trimis un cod de verificare la:</p>
              <p style={{ fontSize: 14, color: "var(--gl)", fontWeight: 600, marginBottom: 18 }}>{email}</p>
            </div>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.trim())}
              placeholder="Codul OTP sau linkul complet din email"
              type="text"
              style={{ ...inp, textAlign: "left", fontSize: 14, letterSpacing: 0, fontFamily: "inherit" }}
              autoComplete="one-time-code"
            />
            <input
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Parola nouă (min 6 caractere)"
              type="password"
              style={inp}
              autoComplete="new-password"
            />
            <input
              value={newPass2}
              onChange={e => setNewPass2(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doResetWithCode()}
              placeholder="Confirmă parola nouă"
              type="password"
              style={inp}
              autoComplete="new-password"
            />
            {err && <div style={{ padding: "8px 12px", borderRadius: 10, marginBottom: 10, background: "rgba(184,92,92,.12)", color: "#E88", fontSize: 12, animation: "shake .3s" }}>{err}</div>}
            <button onClick={doResetWithCode} disabled={loading} style={mBtn}>{loading && spin}Schimbă parola</button>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)", textAlign: "center", marginTop: 12 }}>Dacă emailul conține un link în loc de cod, copiază linkul complet aici.</p>
          </>}

          {mode === "reset_done" && <>
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, color: "#fff", marginBottom: 8 }}>Parolă schimbată!</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 18 }}>Te poți conecta acum cu noua parolă.</p>
              <button onClick={() => { setMode("login"); setErr(""); setPass(""); setOtp(""); setNewPass(""); setNewPass2(""); }} style={mBtn}>Mergi la conectare</button>
            </div>
          </>}

        </div>
        <div style={{padding:"12px 4px 4px",textAlign:"center",fontSize:10,color:"rgba(255,255,255,.18)"}}>Wedify · Wedding Organizer</div>
      </div>
            {showInfo&&<div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
  <div onClick={()=>setShowInfo(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)"}}/>
  <div style={{position:"relative",width:"100%",maxWidth:440,maxHeight:"80vh",overflow:"auto",background:"#2a2218",borderRadius:16,border:"1px solid rgba(255,255,255,.1)",padding:"24px 20px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h3 style={{fontFamily:"var(--fd)",fontSize:18,color:"#fff"}}>Despre datele tale</h3>
      <button onClick={()=>setShowInfo(false)} style={{color:"rgba(255,255,255,.5)",fontSize:20}}>✕</button>
    </div>
    <div style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.8}}>
      <p style={{marginBottom:14}}>Wedify e un proiect gratuit și open-source. Ca să funcționeze, trebuie să stocăm câteva lucruri:</p>
      <p style={{marginBottom:14}}><strong style={{color:"var(--gl)"}}>📋 Ce stocăm:</strong><br/>Numele tău, emailul, și tot ce introduci tu în aplicație — invitați, mese, buget, task-uri, programul nunții.</p>
      <p style={{marginBottom:14}}><strong style={{color:"var(--gl)"}}>🔒 Cine are acces:</strong><br/>Doar tu. Fiecare cont vede doar datele lui. Parola ta e criptată, nici noi nu o putem vedea.</p>
      <p style={{marginBottom:14}}><strong style={{color:"var(--gl)"}}>🌍 Unde sunt:</strong><br/>Pe servere în UE (prin Supabase). Nu trimitem datele în altă parte.</p>
      <p style={{marginBottom:14}}><strong style={{color:"var(--gl)"}}>🚫 Ce NU facem:</strong><br/>Nu vindem date. Nu facem tracking. Nu trimitem spam. Nu folosim cookie-uri de marketing.</p>
      <p style={{marginBottom:14}}><strong style={{color:"var(--gl)"}}>🗑️ Vrei să pleci?</strong><br/>Din Setări poți șterge contul oricând. Totul dispare definitiv — nu păstrăm nimic.</p>
      <p style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>Conform GDPR (Regulamentul UE 2016/679), ai dreptul să-ți accesezi, corectezi sau ștergi datele oricând.</p>
    </div>
    <button onClick={()=>setShowInfo(false)} style={{width:"100%",marginTop:16,padding:12,borderRadius:12,background:"linear-gradient(135deg,var(--g),var(--gd))",color:"#fff",fontSize:14,fontWeight:600}}>Am înțeles 👍</button>
  </div>
</div>}
    </div>
  );
}


export default Auth;
