// Geração de PDF direto no navegador (jsPDF) no padrão New Hydra
// Uso: await gerarPdfOrcamento(dados) -> retorna { blob, fileName }

import { jsPDF } from "jspdf";

/** Converte imagem em dataURL (para logo) */
async function loadImageDataURL(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });
  // desenha em canvas p/ virar dataURL
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/** util: quebra texto por largura */
function splitText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ""), maxWidth);
}

/** formata dd/mm/aaaa */
function fmtDataISO(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

/** Cabeçalho padrão New Hydra */
function drawHeader(doc, { logoDataUrl, empresa = "New Hydra", titulo = "Orçamento de Serviços" }, x, y, pageW) {
  const margin = 16;
  const headerH = 28;

  // faixa suave azul/roxa (inspiração da sua paleta)
  doc.setFillColor(236, 242, 255);
  doc.rect(margin, y, pageW - margin * 2, headerH, "F");

  if (logoDataUrl) {
    // logo à esquerda
    const h = 16;
    const w = h * 1.0;
    doc.addImage(logoDataUrl, "JPEG", margin + 6, y + 6, w, h);
  }

  // empresa + título
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 22, 44);
  doc.setFontSize(12);
  doc.text(empresa, margin + 28, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(64, 78, 117);
  doc.setFontSize(11);
  doc.text(titulo, margin + 28, y + 22);

  return y + headerH + 8; // nova posição Y
}

/** bloco rotulado (rótulo em negrito, conteúdo com quebra de linha) */
function labeledBlock(doc, label, value, x, y, maxWidth) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(label, x, y);

  const lh = 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  const lines = splitText(doc, value, maxWidth);
  lines.forEach((ln, i) => {
    doc.text(ln, x, y + 5 + i * lh);
  });

  return y + 5 + lines.length * lh + 6; // y após o bloco
}

/** lista com marcadores "-" */
function bulletList(doc, title, itens = [], x, y, maxWidth) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(title, x, y);

  const lh = 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  let yy = y + 5;

  itens.forEach((it) => {
    const lines = splitText(doc, `- ${it}`, maxWidth);
    lines.forEach((ln, i) => {
      doc.text(ln, x, yy + i * lh);
    });
    yy += lines.length * lh + 2;
  });

  return yy + 4;
}

export async function gerarPdfOrcamento({
  numero,              // ex: "NH-2025-0007" (opcional)
  data,                // ISO ou Date
  cliente,             // nome
  cnpj,                // opcional
  contato,             // fone/email
  endereco,            // string
  servicos = [],       // array de strings (tópicos)
  valor,               // string: "33.400,00"
  condicoes,           // string
  observacoes,         // string
  logoSrc = "/Logotipo NewHydra.jpeg", // caminho da sua logo
  empresa = "New Hydra",
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 32;
  let y = margin;

  // logo -> dataURL
  let logo = null;
  try { logo = await loadImageDataURL(logoSrc); } catch {}

  // cabeçalho
  y = drawHeader(doc, { logoDataUrl: logo, empresa, titulo: "Orçamento de Serviços" }, 0, y - 8, pageW);

  // faixa de meta (número/data)
  const metaLeft = numero ? `Orçamento nº: ${numero}` : "";
  const metaRight = `Data: ${fmtDataISO(data)}`;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  if (metaLeft) doc.text(metaLeft, margin, y);
  doc.text(metaRight, pageW - margin, y, { align: "right" });
  y += 14;

  // Cliente / CNPJ / contato / endereço
  const wCol = (pageW - margin * 2);
  y = labeledBlock(doc, "Cliente:", cliente || "-", margin, y, wCol);
  if (cnpj) y = labeledBlock(doc, "CNPJ:", cnpj, margin, y, wCol);
  if (contato) y = labeledBlock(doc, "Contato:", contato, margin, y, wCol);
  if (endereco) y = labeledBlock(doc, "Endereço:", endereco, margin, y, wCol);

  // Serviços
  y = bulletList(doc, "Serviços orçados:", servicos && servicos.length ? servicos : ["-"], margin, y, wCol);

  // Valor total
  if (valor) {
    const boxH = 26;
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(247, 250, 255);
    doc.roundedRect(margin, y, wCol, boxH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Valor total:", margin + 10, y + 17);
    doc.setFont("helvetica", "normal");
    doc.text(`R$ ${valor}`, margin + 90, y + 17);
    y += boxH + 10;
  }

  // Condições de pagamento
  if (condicoes) y = labeledBlock(doc, "Condições de pagamento:", condicoes, margin, y, wCol);

  // Observações
  if (observacoes) y = labeledBlock(doc, "Observações:", observacoes, margin, y, wCol);

  // rodapé
  const footerY = doc.internal.pageSize.getHeight() - margin + 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footerY - 18, pageW - margin, footerY - 18);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`${empresa} — Serviços Hidráulicos`, margin, footerY);

  const fileName = `Orcamento_${cliente ? cliente.replace(/\s+/g, "_") : "NewHydra"}_${Date.now()}.pdf`;
  const blob = doc.output("blob");
  return { blob, fileName };
}

/** Dispara download do Blob com nome */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 2000);
}
