import { jsPDF } from "jspdf";

// ===== DADOS FIXOS DA EMPRESA =====
const EMPRESA_NOME   = "NEW HYDRA INSTALAÇÕES HIDRAULICAS LTDA";
const EMPRESA_CNPJ   = "45.082.320/0001-76";
const EMPRESA_FONE   = "+55 47 98441-6389";
const EMPRESA_ENDERECO = "Rua Jorge Mayerle, 192, Bairro Nova Brasilia, Joinville, UF SC";
const EMPRESA_LOGO_SRC = "/Logotipo NewHydra.jpeg";

/** Carrega imagem e converte pra dataURL (logo) */
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

/** Quebra texto pela largura */
function splitText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ""), maxWidth);
}

/** Data ISO -> dd/mm/aaaa */
function fmtDataISO(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

/** Cabeçalho fixo: logo + nome + CNPJ + FONE + ENDEREÇO */
// Substitua a função drawHeader atual por esta versão
async function drawHeader(doc, pageW) {
  const margin = 40;
  let y = margin;

  // Tamanhos e posições
  const blockHeight = 68;               // altura da faixa arredondada
  const blockX = margin - 8;            // leve "escape" à esquerda
  const blockY = y - 12;
  const blockW = pageW - margin * 2 + 16; // largura da faixa (espaço à esquerda/direita)
  const radius = 10;                    // raio dos cantos arredondados

  // Escolha do degradê (cores inspiradas na logo, mas mais claras)
  const colorStart = "#4FA0E1"; // azul-claro
  const colorEnd   = "#9A6BE0"; // roxo-claro

  // --- cria um canvas offscreen para desenhar o degradê com cantos arredondados ---
  // escala para manter boa resolução quando inserido no PDF
  const scale = 2;
  const canvasW = Math.max(1, Math.round(blockW * scale));
  const canvasH = Math.max(1, Math.round(blockHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");

  // função auxiliar: desenha um rounded rect path
  function roundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // desenha o degradê
  const g = ctx.createLinearGradient(0, 0, canvasW, 0); // horizontal
  g.addColorStop(0, colorStart);
  g.addColorStop(1, colorEnd);
  roundedRectPath(ctx, 0, 0, canvasW, canvasH, radius * scale);
  ctx.fillStyle = g;
  ctx.fill();

  // opcional: ligeira sombra interna para dar profundidade (suave)
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  roundedRectPath(ctx, 0, 0, canvasW, canvasH, radius * scale);
  ctx.fill();

  // converte para dataURL
  const bgDataUrl = canvas.toDataURL("image/png");

  // adiciona a faixa ao PDF
  doc.addImage(bgDataUrl, "PNG", blockX, blockY, blockW, blockHeight);

  // --- Logo (se existir) e texto por cima da faixa ---
  // carrega logo como dataURL (usa a função existente loadImageDataURL)
  let logoData = null;
  try {
    logoData = await loadImageDataURL(EMPRESA_LOGO_SRC);
  } catch { logoData = null; }

  const logoW = 48;
  const logoH = 48;
  const logoLeft = blockX + 12;
  const logoTop = blockY + (blockHeight - logoH) / 2;

  if (logoData) {
    doc.addImage(logoData, "JPEG", logoLeft, logoTop, logoW, logoH);
  }

  // Posicionamento do texto: à direita da logo
  const textX = logoLeft + (logoData ? logoW + 12 : 0);
  const lineGap = 12;
  let tx = textX;
  let ty = blockY + 20;

  // Nome da empresa — cor clara (branco)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(EMPRESA_NOME, tx, ty);

  // Demais infos (CNPJ, Fone, Endereço) em tom claro menor
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(245, 245, 245); // branco suave
  doc.text(`CNPJ: ${EMPRESA_CNPJ}`, tx, ty + lineGap);
  doc.text(`FONE: ${EMPRESA_FONE}`, tx, ty + lineGap * 2);

  // Quebra automática do endereço (se muito longo)
  const pageRightLimit = blockX + blockW - 12;
  const maxW = pageRightLimit - tx;
  const enderecoLines = splitText(doc, `ENDEREÇO: ${EMPRESA_ENDERECO}`, maxW);
  enderecoLines.forEach((ln, i) => {
    doc.text(ln, tx, ty + lineGap * (3 + i));
  });

  // Retorna nova posição Y após o cabeçalho (abaixo da faixa)
  return blockY + blockHeight + 14;
}

/** Desenha uma linha simples com label: valor (tudo em uma linha) */
function drawSimpleLine(doc, label, value, x, y, pageW, margin) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const labelText = `${label} `;
  const labelWidth = doc.getTextWidth(labelText);

  doc.text(labelText, x, y);

  doc.setFont("helvetica", "normal");
  const maxWidth = pageW - margin - (x + labelWidth);
  const lines = splitText(doc, value, maxWidth);
  if (!lines.length) return y + 14;

  // primeira linha na mesma linha do label
  doc.text(lines[0], x + labelWidth, y);
  // demais linhas embaixo (se quebrar)
  const lineGap = 12;
  let yy = y;
  for (let i = 1; i < lines.length; i++) {
    yy += lineGap;
    doc.text(lines[i], x, yy);
  }
  return yy + 14;
}

/** Lista de serviços (um por linha, com bom espaçamento) */
function drawServicos(doc, servicos, x, y, pageW, margin) {
  // título no centro igual ao PDF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("NEW HYDRA INSTALAÇÕES HIDRAULICAS LTDA", pageW / 2, y, { align: "center" });
  doc.text("DESCRIÇÃO DOS SERVIÇOS:", pageW / 2, y + 14, { align: "center" });

  y += 14 + 40; // espaço após o título

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const maxWidth = pageW - margin * 2;
  const lineGap = 14;

  const lista = servicos && servicos.length ? servicos : [""];

lista.forEach((s) => {
  const texto = String(s || "").trim();
  if (!texto) return;
  const lines = splitText(doc, texto, maxWidth - 12); // deixa espaço para a bolinha

  // desenha a bolinha "•" no início da primeira linha
  doc.setFont("helvetica", "bold");
  doc.text("•", margin, y);
  doc.setFont("helvetica", "normal");

  lines.forEach((ln, i) => {
    // a primeira linha fica um pouco deslocada para não colar na bolinha
    const offset = i === 0 ? 10 : 0;
    doc.text(ln, margin + offset + 8, y + i * lineGap);
  });
  y += lines.length * lineGap + 4; // espaço entre serviços
});

  return y + 10;
}

/** Caixa com título (caixa de condições / observações) */
function drawBox(doc, title, text, x, y, width) {
  const padding = 8;
  const lineGap = 14;
  const headerHeight = 18;

  // borda
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Medir altura do texto
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = splitText(doc, text || "", width - padding * 2);
  const textHeight = lines.length * lineGap;

  const boxHeight = headerHeight + textHeight + padding * 2;

  doc.rect(x, y, width, boxHeight);

  // título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, x + padding, y + padding + 8);

  // texto
  doc.setFont("helvetica", "normal");
  let ty = y + padding + headerHeight;
  lines.forEach((ln, i) => {
    doc.text(ln, x + padding, ty + i * lineGap);
  });

  return y + boxHeight + 16;
}

/** Assinaturas: linha cliente à esquerda, empresa à direita */
function drawSignatures(doc, pageW, pageH, margin) {
  const lineWidth = 180;
  const y = pageH - margin - 40;

  // linha cliente
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, margin + lineWidth, y);
  // linha empresa
  const rightX = pageW - margin - lineWidth;
  doc.line(rightX, y, rightX + lineWidth, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Assinatura do Cliente", margin + lineWidth / 2, y + 14, { align: "center" });
  doc.text("Assinatura da Empresa", rightX + lineWidth / 2, y + 14, { align: "center" });
}

/**
 * Gera o PDF exatamente no padrão do orçamento da NEW HYDRA
 */
export async function gerarPdfOrcamento({
  numero,          // não usado no layout original, mas deixei disponível
  data,
  cliente,
  cnpj,
  contato,
  enderecoObra,    // obra / endereço do orçamento
  responsavel,
  prazoEntrega,
  servicos = [],
  valor,           // opcional — pode ser citado em condições
  condicoes,
  observacoes,
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Cabeçalho fixo
  let y = await drawHeader(doc, pageW);

  // Bloco de dados do cliente (uma linha por campo)
  const x = margin;
  y += 4;

  y = drawSimpleLine(doc, "CLIENTE:", cliente || "", x, y, pageW, margin);
  y = drawSimpleLine(doc, "OBRA / ENDEREÇO:", enderecoObra || "", x, y, pageW, margin);
  y = drawSimpleLine(doc, "RESPONSÁVEL:", responsavel || "", x, y, pageW, margin);
  y = drawSimpleLine(doc, "DATA:", fmtDataISO(data), x, y, pageW, margin);
  y = drawSimpleLine(doc, "Prazo de Entrega:", prazoEntrega || "", x, y, pageW, margin);

  y += 10; // respiro

  // Título + descrição dos serviços
  y = drawServicos(doc, servicos, x, y, pageW, margin);

  // Caixa de Condições de pagamento
  const textoCondicoes = condicoes || (valor ? `Valor total: R$ ${valor}` : "");
  y = drawBox(doc, "CONDIÇÕES DE PAGAMENTO", textoCondicoes, margin, y, pageW - margin * 2);

  // Caixa de Informações gerais / Observações
  y = drawBox(doc, "INFORMAÇÕES GERAIS / OBSERVAÇÕES", observacoes || "", margin, y, pageW - margin * 2);

  // Assinaturas no rodapé
  drawSignatures(doc, pageW, pageH, margin);

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
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
