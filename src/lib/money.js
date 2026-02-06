import Decimal from "decimal.js";

// Converte entrada livre (string/number) para centavos inteiros.
export function parseToCents(input){
  if (input === null || input === undefined) throw new Error("Valor obrigatório");
  const raw = String(input)
    .replace(/\s/g, "")
    .replace(/[R$\u00A0]/g, "");
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized = raw;
  if (hasComma && hasDot) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      normalized = raw.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = raw.replace(",", ".");
  } else if (hasDot) {
    normalized = raw.replace(/,/g, "");
  }
  const dec = new Decimal(normalized || "0");
  if (!dec.isFinite()) throw new Error("Valor inválido");
  if (dec.isNeg()) throw new Error("Valor não pode ser negativo");
  return dec.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

// Formata centavos inteiros para BRL.
export function formatCents(cents){
  const n = Number.isFinite(cents) ? cents : 0;
  const asNumber = n / 100;
  try{
    return asNumber.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }catch{
    return `R$ ${asNumber.toFixed(2)}`;
  }
}

// Soma segura de centavos.
export function sumCents(arr){
  return (arr||[]).reduce((acc, v)=> acc + (Number.isFinite(v)? v : 0), 0);
}
