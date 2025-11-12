export function formatBRL(v){
  const n = Number(v||0);
  try{
    return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }catch{
    return `R$ ${n.toFixed(2)}`;
  }
}

export function parseBRL(s){
  if (typeof s === "number") return s;
  if (!s) return 0;
  const cleaned = String(s).replace(/\s/g,"").replace(/[R$\u00A0]/g,"").replace(/\./g,"").replace(",",".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
