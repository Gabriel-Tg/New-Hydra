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
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/** quebra texto pela largura */
function splitText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ""), maxWidth);
}

function fmtDataISO(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

/** Cabeçalho com logo + faixa suave */
function drawHeader(doc, { logoDataUrl, empresa, titulo }, pageW) {
  const margin = 32;
  const headerH = 34;
  const y = margin;

  doc.setFillColor(236, 242, 255);
  doc.roundedRect(margin, y, pageW - margin * 2, headerH, 10, 10, "F");

  if (logoDataUrl) {
    const h = 22;
    const w = h * 1.0;
    doc.addImage(logoDataUrl, "JPEG", margin + 12, y + (headerH - h) / 2, w, h);
  }

  // textos
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.text(empresa, margin + 48, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(11);
  doc.text(titulo, margin + 48, y + 27);

  return y + headerH + 18; // novo Y livre
}

/** Bloco com rótulo e parágrafo com respiro */
function labeledBlock(doc, label, value, x, y, maxWidth) {
  const labelGap = 12;
  const lineGap = 14;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(label, x, y);

  const baseY = y + labelGap;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(11);

  const lines = splitText(doc, value, maxWidth);
  lines.forEach((ln, i) => {
    doc.text(ln, x, baseY + i * lineGap);
  });

  // espaço extra após o bloco
  return baseY + lines.length * lineGap + 12;
}

/** Lista de serviços com marcadores e mais espaçamento */
function bulletList(doc, title, itens = [], x, y, maxWidth) {
  // linha divisória suave antes da seção
  doc.setDrawColor(229, 231, 235);
  doc.line(x, y - 6, x + maxWidth, y - 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(title, x, y);

  const lineGap = 14;
  let yy = y + 10;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(11);

  const lista = itens && itens.length ? itens : ["-"];

  lista.forEach((it) => {
    const lines = splitText(doc, `- ${it}`, maxWidth);
    lines.forEach((ln, i) => {
      doc.text(ln, x, yy + i * lineGap);
    });
    yy += lines.length * lineGap + 4; // espaço entre itens
  });

  return yy + 10; // espaço após seção
}

export async function gerarPdfOrcamento({
  numero,
  data,
  cliente,
  cnpj,
  contato,
  endereco,
  servicos = [],
  valor,
  condicoes,
  observacoes,
  logoSrc = "/Logotipo NewHydra.jpeg",
  empresa = "New Hydra",
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  let y = margin;

  // logo
  let logo = null;
  try {
    logo = await loadImageDataURL(logoSrc);
  } catch {
    logo = null;
  }

  // cabeçalho
  y = drawHeader(doc, { logoDataUrl: logo, empresa, titulo: "Orçamento de Serviços" }, pageW);

  // meta (número / data)
  const metaLeft = numero ? `Orçamento nº: ${numero}` : "";
  const metaRight = `Data: ${fmtDataISO(data)}`;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  if (metaLeft) doc.text(metaLeft, margin, y);
  doc.text(metaRight, pageW - margin, y, { align: "right" });
  y += 18;

  const wCol = pageW - margin * 2;

  // Cliente / CNPJ / contato / endereço (cada bloco bem separado)
  y = labeledBlock(doc, "Cliente:", cliente || "-", margin, y, wCol);
  if (cnpj) y = labeledBlock(doc, "CNPJ:", cnpj, margin, y, wCol);
  if (contato) y = labeledBlock(doc, "Contato:", contato, margin, y, wCol);
  if (endereco) y = labeledBlock(doc, "Endereço:", endereco, margin, y, wCol);

  // Serviços (lista em tópicos)
  y = bulletList(doc, "Serviços orçados:", servicos, margin, y, wCol);

  // Valor total em box destacado
  if (valor) {
    const boxH = 30;
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, wCol, boxH, 8, 8, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Valor total:", margin + 12, y + 19);

    doc.setFont("helvetica", "normal");
    doc.text(`R$ ${valor}`, margin + 110, y + 19);

    y += boxH + 16;
  }

  // Condições de pagamento
  if (condicoes) {
    y = labeledBlock(doc, "Condições de pagamento:", condicoes, margin, y, wCol);
  }

  // Observações
  if (observacoes) {
    y = labeledBlock(doc, "Observações:", observacoes, margin, y, wCol);
  }

  // rodapé fixo
  const footerY = pageH - margin + 6;
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

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
