import React, { useEffect, useMemo, useRef, useState } from "react";
import { catalogoBase, sortByMmDesc } from "../lib/catalogo.jsx";

// monta texto do WhatsApp
function montarMensagem({ cliente, itens, observacoes }) {
  const linhas = [];
  linhas.push("🧾 Pedido de Compra");
  linhas.push(`Cliente: ${cliente || "-"}`);
  linhas.push("-----------------");
  itens.forEach((i) => linhas.push(`* ${i.desc} - Quantidade: ${i.qtd}`));
  linhas.push("-----------------");
  linhas.push("Observações:");
  linhas.push(observacoes?.trim() ? observacoes.trim() : "-");
  linhas.push("-----------------");
  linhas.push("Enviado pelo app New Hydra Pedidos.");
  return linhas.join("\n");
}

// Persistência em sessão (dados não ficam no localStorage permanente)
const KEY = "pedidos_v1";
function loadPedidos(){ try{ return JSON.parse(sessionStorage.getItem(KEY) || "[]"); }catch{ return []; } }
function savePedidos(arr){ sessionStorage.setItem(KEY, JSON.stringify(arr)); }

export default function Pedidos(){
  // registro histórico
  const [pedidos, setPedidos] = useState(loadPedidos());
  useEffect(()=> savePedidos(pedidos), [pedidos]);

  // estado do pedido atual
  const [editando, setEditando] = useState(false); // controla se estamos em "Novo pedido"
  const [cliente, setCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itensPedido, setItensPedido] = useState([]);
  const [waPhone, setWaPhone] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualQtd, setManualQtd] = useState("");

  // busca dinâmica — lista aparece SOMENTE quando há busca
  const [busca, setBusca] = useState("");
  const [qtdMap, setQtdMap] = useState({});
  const qtdRefs = useRef({});

  const catalogoOrdenado = useMemo(() => sortByMmDesc(catalogoBase), []);
  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return []; // só mostra lista se tiver algo digitado
    return catalogoOrdenado.filter(i => i.desc.toLowerCase().includes(q));
  }, [busca, catalogoOrdenado]);

  function novoPedido(){
    setEditando(true);
    setCliente("");
    setObservacoes("");
    setItensPedido([]);
    setBusca("");
    setQtdMap({});
    setWaPhone("");
  }

  function cancelarPedido(){
    setEditando(false);
  }

  function addItemAoPedido({ id, desc, qtd }){
    const n = Number(qtd);
    if (!desc || !n || n <= 0) return;
    setItensPedido(prev=>{
      const idx = prev.findIndex(x=>x.id===id);
      if (idx>=0){
        const cp=[...prev]; cp[idx]={...cp[idx], qtd: cp[idx].qtd + n}; return cp;
      }
      return [...prev, {id, desc, qtd:n}];
    });
  }

  function handleOkItem(it){
    const qtd = Number(qtdMap[it.id]);
    if (!qtd || qtd<=0) return;
    addItemAoPedido({id:it.id, desc:it.desc, qtd});
    setQtdMap(m=>({...m, [it.id]:""}));
    const ref=qtdRefs.current[it.id]; if(ref) ref.focus();
  }

  function cadastrarManual(){
    const desc = manualDesc.trim();
    const qtd = Number(manualQtd);
    if (!desc){ alert("Informe a descrição do item."); return; }
    if (!qtd || qtd<=0){ alert("Quantidade inválida."); return; }
    const id = "man-" + desc.toLowerCase().replace(/\s+/g,"-").slice(0,48);
    addItemAoPedido({id, desc, qtd});
    setManualDesc("");
    setManualQtd("");
  }

  function finalizarEnviar(){
    if (!cliente.trim()){ alert("Informe o cliente."); return; }
    if (itensPedido.length===0){ alert("Adicione ao menos um item."); return; }

    // salva no registro
    const registro = {
      id: Date.now().toString(36),
      data: new Date().toISOString(),
      cliente,
      observacoes,
      itens: itensPedido,
    };
    setPedidos(prev => [registro, ...prev]);

    // WhatsApp
    const texto = montarMensagem({ cliente, itens: itensPedido, observacoes });
    const base = "https://wa.me/";
    const phone = waPhone.replace(/\D/g,"");
    const url = phone ? `${base}${phone}?text=${encodeURIComponent(texto)}`
                      : `${base}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

    // encerra edição
    setEditando(false);
  }

  return (
    <div className="stack fade-in">
      {/* Registro de pedidos */}
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap"}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:20}}>🧾</span>
            <div style={{fontWeight:800, fontSize:18}}>Pedidos</div>
          </div>
          <button className="btn primary ripple" onClick={novoPedido}>+ Novo pedido</button>
        </div>
        {pedidos.length===0 ? (
          <div className="muted" style={{marginTop:8}}>Sem registros ainda.</div>
        ) : (
          <div className="table-card" style={{marginTop:12}}>
            {pedidos.map(p => (
              <div key={p.id} className="table-row">
                <div style={{minWidth:92}}>{new Date(p.data).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{p.cliente}</div>
                <div className="muted" style={{minWidth:100}}>{p.itens.length} item(ns)</div>
                <button className="btn ripple" onClick={()=>{
                  const texto = montarMensagem({ cliente: p.cliente, itens: p.itens, observacoes: p.observacoes });
                  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
                  window.open(url, "_blank");
                }}>Reenviar WhatsApp</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor de pedido (aparece só quando clicou em Novo pedido) */}
      {editando && (
        <>
          {/* Cliente / Observações / WhatsApp */}
          <div className="card">
            <div className="stack">
              <label className="muted" style={{fontSize:12}}>Cliente</label>
              <input className="input" placeholder="Digite o nome do cliente" value={cliente} onChange={e=>setCliente(e.target.value)} />
              <label className="muted" style={{fontSize:12}}>Observações</label>
              <textarea className="input" rows={3} placeholder="Ex.: Pagamento 28dd" value={observacoes} onChange={e=>setObservacoes(e.target.value)} />
              <label className="muted" style={{fontSize:12}}>WhatsApp (opcional) — 55DDDNUMERO</label>
              <input className="input" inputMode="numeric" placeholder="55DDDNUMERO" value={waPhone} onChange={e=>setWaPhone(e.target.value)} />
            </div>
          </div>

          {/* Busca → lista aparece apenas quando buscar */}
          <div className="card">
            <div className="stack">
              <label className="muted" style={{fontSize:12}}>Pesquisar Itens:</label>
              <input
                className="input"
                placeholder='Ex.: "50 mm"'
                value={busca}
                onChange={e=>setBusca(e.target.value)}
              />
              <div className="muted" style={{fontSize:12}}>Dica: digite pelo menos 2 caracteres.</div>
            </div>

            {resultados.length>0 && (
              <div className="stack" style={{marginTop:12}}>
                {resultados.map(it=>(
                  <div key={it.id} className="row" style={{alignItems:"center", justifyContent:"space-between", borderTop:"1px solid var(--border)", paddingTop:8}}>
                    <div style={{flex:1, paddingRight:8}}>{it.desc}</div>
                    <input
                      ref={el => (qtdRefs.current[it.id]=el)}
                      className="input"
                      placeholder="Qtd"
                      inputMode="numeric"
                      style={{width:84}}
                      value={qtdMap[it.id] ?? ""}
                      onChange={e=>setQtdMap(m=>({...m, [it.id]: e.target.value}))}
                    />
                    <button className="btn primary ripple" style={{minWidth:60}} onClick={()=>handleOkItem(it)}>OK</button>
                  </div>
                ))}

                {/* cadastrar manual direto daqui */}
                <div className="row" style={{alignItems:"center", justifyContent:"space-between", borderTop:"1px solid var(--border)", paddingTop:8, flexWrap:"wrap", gap:8}}>
                  <div className="muted" style={{flex:1, minWidth:160}}>Não encontrou? Cadastre manualmente.</div>
                  <input className="input" placeholder="Descrição" value={manualDesc} onChange={e=>setManualDesc(e.target.value)} style={{flex:2, minWidth:200}} />
                  <input className="input" placeholder="Qtd" inputMode="numeric" value={manualQtd} onChange={e=>setManualQtd(e.target.value)} style={{width:80}} />
                  <button className="btn ripple" onClick={cadastrarManual}>Cadastrar item</button>
                </div>
              </div>
            )}
          </div>

          {/* Itens do pedido */}
          <div className="card">
            <div style={{fontWeight:700, marginBottom:8}}>Itens do Pedido</div>
            {itensPedido.length===0 ? (
              <div className="muted">Nenhum item adicionado ainda.</div>
            ) : (
              <div className="table-card">
                {itensPedido.map(p=>(
                  <div key={p.id} className="table-row">
                    <div style={{flex:1}}>{p.desc}</div>
                    <div style={{minWidth:90, textAlign:"right"}}><strong>x {p.qtd}</strong></div>
                    <button className="btn ripple" onClick={()=>setItensPedido(prev=>prev.filter(x=>x.id!==p.id))}>Remover</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex", justifyContent:"space-between", marginTop:12, gap:8, flexWrap:"wrap"}}>
              <button className="btn ripple" onClick={cancelarPedido}>Cancelar</button>
              <button className="btn primary ripple" onClick={finalizarEnviar}>Finalizar e enviar ao WhatsApp</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
