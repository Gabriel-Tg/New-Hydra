import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";

export default function ClientAutocomplete({ value, onChange, placeholder="Cliente" }) {
  const clients = useStore(s=>s.clients);
  const [focus, setFocus] = useState(false);

  const list = useMemo(()=>{
    const v = (value||"").toLowerCase();
    if (!v) return clients.slice(0,6);
    return clients.filter(c => c.name.toLowerCase().includes(v)).slice(0,6);
  }, [value, clients]);

  return (
    <div style={{position:"relative"}}>
      <input
        type="text"
        value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocus(true)}
        onBlur={()=>setTimeout(()=>setFocus(false),150)}
        placeholder={placeholder}
        className="input"
        style={{width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:12}}
      />
      {focus && list.length>0 && (
        <div className="card" style={{position:"absolute", top:"100%", left:0, right:0, marginTop:6, zIndex:30}}>
          {list.map(c=>(
            <button key={c.id} className="btn" style={{width:"100%", textAlign:"left"}} onClick={()=>onChange(c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="muted" style={{fontSize:12}}>Digite um novo nome para cadastrar automaticamente.</div>
    </div>
  );
}
