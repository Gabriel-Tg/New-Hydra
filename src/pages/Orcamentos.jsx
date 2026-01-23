import React, { useEffect, useMemo, useState } from "react";
import { gerarPdfOrcamento, downloadBlob } from "../lib/pdfOrcamento.js";

// Persistência apenas em sessão (evita deixar dados sensíveis em localStorage durável)
const KEY = "orcamentos_v1";
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; } };
const save = (arr) => sessionStorage.setItem(KEY, JSON.stringify(arr));

function mensagemWhatsAppResumo({ cliente, valor }) {
  const linhas = [];
  linhas.push("📄 *Novo Orçamento*");
  if (cliente) linhas.push(`Cliente: *${cliente}*`);
  if (valor)   linhas.push(`Valor total: *R$ ${valor}*`);
  linhas.push("");
  linhas.push("O PDF foi gerado. Anexe-o nesta conversa.");
  linhas.push("");
  linhas.push("_Enviado pelo app New Hydra Orçamentos._");
  return linhas.join("\n");
}

export default function Orcamentos(){
  const [lista, setLista] = useState(load());
  useEffect(()=> save(lista), [lista]);

  const [editando, setEditando] = useState(false);

  // formulário
  const [numero, setNumero] = useState("");
  const [data, setData] = useState(() => new Date().toISOString());
  const [cliente, setCliente] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [enderecoObra, setEnderecoObra] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");

  const [servicoInput, setServicoInput] = useState("");
  const [servicos, setServicos] = useState([]);

  const [valor, setValor] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [waPhone, setWaPhone] = useState("");

  const temFormulario = useMemo(()=>(
    cliente || cnpj || contato || enderecoObra || responsavel || prazoEntrega ||
    servicos.length || valor || condicoes || observacoes
  ), [cliente, cnpj, contato, enderecoObra, responsavel, prazoEntrega, servicos, valor, condicoes, observacoes]);

  function novoOrcamento(){
    setEditando(true);
    setNumero("");
    setData(new Date().toISOString());
    setCliente("");
    setCnpj("");
    setContato("");
    setEnderecoObra("");
    setResponsavel("");
    setPrazoEntrega("");
    setServicos([]);
    setServicoInput("");
    setValor("");
    setCondicoes("");
    setObservacoes("");
    setWaPhone("");
  }

  function cancelar(){
    if (temFormulario && !confirm("Descartar informações não salvas?")) return;
    setEditando(false);
  }

  function addTopico(){
    const t = (servicoInput || "").trim();
    if (!t) return;
    setServicos(prev => [...prev, t]);
    setServicoInput("");
  }

  function removerTopico(idx){
    setServicos(prev => prev.filter((_,i)=> i!==idx));
  }

  async function gerarPdfEWhatsApp(){
    if (!cliente.trim()){ alert("Informe o cliente."); return; }
    if (!servicos.length){ alert("Adicione pelo menos um tópico de serviço."); return; }

    // gera PDF alinhado ao padrão NEW HYDRA
    const { blob, fileName } = await gerarPdfOrcamento({
      numero,
      data,
      cliente,
      cnpj,
      contato,
      enderecoObra,
      responsavel,
      prazoEntrega,
      servicos,
      valor,
      condicoes,
      observacoes,
    });
    downloadBlob(blob, fileName);

    // salva registro
    const registro = {
      id: Date.now().toString(36),
      numero: numero || null,
      data,
      cliente, cnpj, contato,
      enderecoObra,
      responsavel,
      prazoEntrega,
      servicos,
      valor, condicoes, observacoes,
      fileName,
    };
    setLista(prev => [registro, ...prev]);

    // abre WhatsApp com resumo
    const texto = mensagemWhatsAppResumo({ cliente, valor });
    const base = "https://wa.me/";
    const phone = waPhone.replace(/\D/g,"");
    const url = phone ? `${base}${phone}?text=${encodeURIComponent(texto)}`
                      : `${base}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

    setEditando(false);
  }

  return (
    <div className="stack fade-in">
      {/* Registro */}
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap"}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:20}}>📄</span>
            <div style={{fontWeight:800, fontSize:18}}>Orçamentos</div>
          </div>
          <button className="btn primary ripple" onClick={novoOrcamento}>+ Novo orçamento</button>
        </div>

        {lista.length===0 ? (
          <div className="muted" style={{marginTop:8}}>Nenhum orçamento ainda.</div>
        ) : (
          <div className="table-card" style={{marginTop:12}}>
            {lista.map(o=>(
              <div key={o.id} className="table-row">
                <div style={{minWidth:92}}>{new Date(o.data).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{o.cliente}</div>
                <div className="muted" style={{minWidth:120}}>{o.numero || "—"}</div>
                <button
                  className="btn ripple"
                  onClick={async ()=>{
                    const { blob, fileName } = await gerarPdfOrcamento({
                      numero: o.numero,
                      data: o.data,
                      cliente: o.cliente,
                      cnpj: o.cnpj,
                      contato: o.contato,
                      enderecoObra: o.enderecoObra,
                      responsavel: o.responsavel,
                      prazoEntrega: o.prazoEntrega,
                      servicos: o.servicos,
                      valor: o.valor,
                      condicoes: o.condicoes,
                      observacoes: o.observacoes,
                    });
                    downloadBlob(blob, fileName);
                  }}
                >
                  Baixar PDF
                </button>
                <button
                  className="btn ripple"
                  onClick={()=>{
                    const texto = mensagemWhatsAppResumo({ cliente: o.cliente, valor: o.valor });
                    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
                    window.open(url, "_blank");
                  }}
                >
                  WhatsApp
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      {editando && (
        <>
          <div className="card">
            <div className="row">
              <div className="stack" style={{flex:1, minWidth:220}}>
                <label className="muted" style={{fontSize:12}}>Nº (opcional)</label>
                <input
                  className="input"
                  value={numero}
                  onChange={e=>setNumero(e.target.value)}
                  placeholder="Ex.: NH-2025-0007"
                />
              </div>
              <div className="stack" style={{flex:1, minWidth:220}}>
                <label className="muted" style={{fontSize:12}}>Data</label>
                <input
                  className="input"
                  type="date"
                  value={new Date(data).toISOString().slice(0,10)}
                  onChange={e=>setData(new Date(e.target.value).toISOString())}
                />
              </div>
            </div>

            <div className="row">
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Cliente</label>
                <input
                  className="input"
                  value={cliente}
                  onChange={e=>setCliente(e.target.value)}
                  placeholder="Nome/Razão Social"
                />
              </div>
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>CNPJ (opcional)</label>
                <input
                  className="input"
                  value={cnpj}
                  onChange={e=>setCnpj(e.target.value)}
                  placeholder="45.082.320/0001-76"
                />
              </div>
            </div>

            <div className="row">
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Contato</label>
                <input
                  className="input"
                  value={contato}
                  onChange={e=>setContato(e.target.value)}
                  placeholder="(47) 98441-6389 | email"
                />
              </div>
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Obra / Endereço</label>
                <input
                  className="input"
                  value={enderecoObra}
                  onChange={e=>setEnderecoObra(e.target.value)}
                  placeholder="Obra / Endereço do serviço"
                />
              </div>
            </div>

            <div className="row">
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Responsável</label>
                <input
                  className="input"
                  value={responsavel}
                  onChange={e=>setResponsavel(e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Prazo de Entrega</label>
                <input
                  className="input"
                  value={prazoEntrega}
                  onChange={e=>setPrazoEntrega(e.target.value)}
                  placeholder="Ex.: 15 dias"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{fontWeight:700, marginBottom:8}}>Descrição dos serviços (tópicos)</div>
            <div className="row">
              <input
                className="input"
                style={{flex:1}}
                placeholder="Ex.: Instalação dos sanitários do empreendimento"
                value={servicoInput}
                onChange={e=>setServicoInput(e.target.value)}
              />
              <button className="btn ripple" onClick={addTopico}>Adicionar</button>
            </div>
            <div className="table-card" style={{marginTop:8}}>
              {servicos.length===0 ? (
                <div className="muted">Nenhum tópico adicionado.</div>
              ) : servicos.map((t, i)=>(
                <div key={i} className="table-row">
                  <div style={{flex:1}}>{t}</div>
                  <button className="btn ripple" onClick={()=>removerTopico(i)}>Remover</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="row">
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Valor total (opcional)</label>
                <input
                  className="input"
                  value={valor}
                  onChange={e=>setValor(e.target.value)}
                  placeholder="Ex.: 33.400,00"
                />
              </div>
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>Condições de pagamento</label>
                <input
                  className="input"
                  value={condicoes}
                  onChange={e=>setCondicoes(e.target.value)}
                  placeholder="Ex.: Entrada + parcelas conforme execução"
                />
              </div>
            </div>

            <div className="stack" style={{marginTop:8}}>
              <label className="muted" style={{fontSize:12}}>Informações gerais / Observações</label>
              <textarea
                className="input"
                rows={3}
                value={observacoes}
                onChange={e=>setObservacoes(e.target.value)}
                placeholder="Ex.: Prazo conforme cronograma do cliente."
              />
            </div>

            <div className="row" style={{marginTop:12}}>
              <div className="stack" style={{flex:1}}>
                <label className="muted" style={{fontSize:12}}>WhatsApp (opcional) — 55DDDNUMERO</label>
                <input
                  className="input"
                  value={waPhone}
                  onChange={e=>setWaPhone(e.target.value)}
                  placeholder="55DDDNUMERO"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div style={{display:"flex", justifyContent:"space-between", marginTop:12, gap:8, flexWrap:"wrap"}}>
              <button className="btn ripple" onClick={cancelar}>Cancelar</button>
              <button className="btn primary ripple" onClick={gerarPdfEWhatsApp}>
                Gerar PDF e abrir WhatsApp
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
