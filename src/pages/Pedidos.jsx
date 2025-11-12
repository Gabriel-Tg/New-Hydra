import React, { useMemo, useRef, useState } from "react";
import { catalogoBase, sortByMmDesc } from "../lib/catalogo.jsx";

// util simples para montar o texto do WhatsApp
function montarMensagem({ cliente, itens, observacoes }) {
  const linhas = [];
  linhas.push("🧾 Pedido de Compra");
  linhas.push(`Cliente: ${cliente || "-"}`);
  linhas.push("-----------------");
  itens.forEach((i) => {
    linhas.push(`* ${i.desc} - Quantidade: ${i.qtd}`);
  });
  linhas.push("-----------------");
  linhas.push("Observações:");
  linhas.push(observacoes?.trim() ? observacoes.trim() : "-");
  linhas.push("-----------------");
  linhas.push("Enviado pelo app New Hydra Pedidos.");
  return linhas.join("\n");
}

export default function Pedidos() {
  // ---- estado do pedido ----
  const [cliente, setCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itensPedido, setItensPedido] = useState([]); // [{id, desc, qtd}]
  const [busca, setBusca] = useState("");
  const [waPhone, setWaPhone] = useState(""); // opcional (55DDDNumero)

  // campo de cadastro manual de item
  const [novoDesc, setNovoDesc] = useState("");
  const [novoQtd, setNovoQtd] = useState("");

  // quantidades digitadas na lista (mapa por id)
  const [qtdMap, setQtdMap] = useState({});
  const qtdRefs = useRef({}); // para focar/limpar campo após OK

  // catálogo base (ordenado por mm desc)
  const catalogoOrdenado = useMemo(() => sortByMmDesc(catalogoBase), []);
  const listaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return catalogoOrdenado;
    return catalogoOrdenado.filter((i) => i.desc.toLowerCase().includes(q));
  }, [busca, catalogoOrdenado]);

  // adiciona item ao pedido (ou soma quantidades se já existir)
  function addItemAoPedido({ id, desc, qtd }) {
    const n = Number(qtd);
    if (!desc || !n || n <= 0) return;
    setItensPedido((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const cp = [...prev];
        cp[idx] = { ...cp[idx], qtd: cp[idx].qtd + n };
        return cp;
      }
      return [...prev, { id, desc, qtd: n }];
    });
  }

  function handleOkItem(it) {
    const qtd = Number(qtdMap[it.id]);
    if (!qtd || qtd <= 0) return;
    addItemAoPedido({ id: it.id, desc: it.desc, qtd });
    // limpa quantidade digitada daquele item
    setQtdMap((m) => ({ ...m, [it.id]: "" }));
    // foca novamente no input daquele item
    const ref = qtdRefs.current[it.id];
    if (ref) ref.focus();
  }

  function handleCadastrarManual() {
    const desc = novoDesc.trim();
    const qtd = Number(novoQtd);
    if (!desc || !qtd || qtd <= 0) return;
    // cria um id estável com base na descrição
    const id = "man-" + desc.toLowerCase().replace(/\s+/g, "-").slice(0, 48);
    addItemAoPedido({ id, desc, qtd });
    setNovoDesc("");
    setNovoQtd("");
  }

  function handleNovoPedido() {
    if (!window.confirm("Iniciar um novo pedido? Isso limpará os campos.")) return;
    setCliente("");
    setObservacoes("");
    setItensPedido([]);
    setBusca("");
    setQtdMap({});
    setWaPhone("");
  }

  function handleEnviarWhatsapp() {
    if (!cliente.trim()) {
      alert("Informe o cliente.");
      return;
    }
    if (itensPedido.length === 0) {
      alert("Adicione ao menos um item ao pedido.");
      return;
    }
    const texto = montarMensagem({ cliente, itens: itensPedido, observacoes });
    const base = "https://wa.me/";
    const phone = waPhone.replace(/\D/g, ""); // só dígitos
    const url = phone ? `${base}${phone}?text=${encodeURIComponent(texto)}` : `${base}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="stack fade-in">
      {/* Cabeçalho/ação */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧾</span>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Pedidos</div>
          </div>
          <button className="btn ripple" onClick={handleNovoPedido}>+ Novo Pedido</button>
        </div>
      </div>

      {/* Cliente */}
      <div className="card">
        <div className="stack">
          <label className="muted" style={{ fontSize: 12 }}>Selecione o Cliente:</label>
          <input
            className="input"
            list="clientes-datalist"
            placeholder="Digite o nome do cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
          {/* se tiver uma lista de clientes, você pode preencher o datalist */}
          <datalist id="clientes-datalist">
            {/* <option value="Gabriel" />
            <option value="Thiago Souza" /> */}
          </datalist>

          <label className="muted" style={{ fontSize: 12 }}>Observações:</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Ex.: Pagamento 28dd"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />

          <div className="row">
            <div className="stack" style={{ flex: 1, minWidth: 180 }}>
              <label className="muted" style={{ fontSize: 12 }}>Enviar para WhatsApp (opcional)</label>
              <input
                className="input"
                placeholder="55DDDNUMERO (só dígitos)"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Busca + lista dinâmica */}
      <div className="card">
        <div className="stack">
          <label className="muted" style={{ fontSize: 12 }}>Pesquisar Itens:</label>
          <input
            className="input"
            placeholder="Ex.: 90 mm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="stack" style={{ marginTop: 12 }}>
          {listaFiltrada.map((it) => (
            <div key={it.id} className="row" style={{ alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              <div style={{ flex: 1, paddingRight: 8 }}>{it.desc}</div>

              <input
                ref={(el) => (qtdRefs.current[it.id] = el)}
                className="input"
                placeholder="Qtd"
                inputMode="numeric"
                style={{ width: 84 }}
                value={qtdMap[it.id] ?? ""}
                onChange={(e) => setQtdMap((m) => ({ ...m, [it.id]: e.target.value }))}
              />

              <button className="btn primary ripple" onClick={() => handleOkItem(it)} style={{ minWidth: 60 }}>
                OK
              </button>
            </div>
          ))}

          {/* Cadastro manual simples */}
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            <input
              className="input"
              placeholder="Cadastrar item (descrição)"
              value={novoDesc}
              onChange={(e) => setNovoDesc(e.target.value)}
              style={{ flex: 1, marginRight: 8 }}
            />
            <input
              className="input"
              placeholder="Qtd"
              inputMode="numeric"
              value={novoQtd}
              onChange={(e) => setNovoQtd(e.target.value)}
              style={{ width: 84 }}
            />
            <button className="btn ripple" onClick={handleCadastrarManual}>Adicionar</button>
          </div>
        </div>
      </div>

      {/* Itens do pedido */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Itens do Pedido</div>
        {itensPedido.length === 0 ? (
          <div className="muted">Nenhum item adicionado ainda.</div>
        ) : (
          <div className="table-card">
            {itensPedido.map((p) => (
              <div key={p.id} className="table-row">
                <div style={{ flex: 1 }}>{p.desc}</div>
                <div style={{ minWidth: 90, textAlign: "right" }}><strong>x {p.qtd}</strong></div>
                <button className="btn ripple" onClick={() => setItensPedido((prev) => prev.filter((x) => x.id !== p.id))}>
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
          <button className="btn ripple" onClick={handleNovoPedido}>Descartar</button>
          <button className="btn primary ripple" onClick={handleEnviarWhatsapp}>
            Finalizar e enviar ao WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
