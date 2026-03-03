import { useState } from "react";
import { useApp } from "../context/AppContext";
import { getSupabase } from "../lib/supabase-client";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import { Fld } from "../ui/Fld";
import { ic } from "../lib/icons";

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

function Settings({open,onClose}){
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

export default Settings;
