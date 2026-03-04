import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase-client";
import { Btn } from "../ui/Btn";

function Auth({onLogin}){
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
      options:{data:{name:n},emailRedirectTo:`${window.location.origin}/auth/confirm`}
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
      redirectTo:`${window.location.origin}/auth/confirm`
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

export default Auth;
