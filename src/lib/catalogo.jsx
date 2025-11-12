export const catalogoBase = [
  { id: "tubo-ppr-90mm", desc: "Tubo Tigre PN20 PPR 90 mm 3 M" },
  { id: "uniao-ppr-90mm", desc: "União Tigre Dupla c/ Parafuso PPR 90 mm" },
  { id: "luva-ppr-90mm", desc: "Luva Tigre PPR 90 mm" },
  { id: "con-macho-ppr-90mm-3pol", desc: "Conector macho PPR 90 mm 3 polegadas" },
  { id: "te-ppr-90mm", desc: "Tê Tigre PPR 90 mm" },
  { id: "joelho-90-90mm", desc: "Joelho Tigre PPR 90° 90 mm" },
  { id: "joelho-45-90mm", desc: "Joelho Tigre PPR 45° 90 mm" },

  { id: "joelho-90-50mm", desc: "Joelho 90 graus 50 mm soldável" },
  { id: "joelho-90-32mm", desc: "Joelho 90 graus 32 mm soldável" },
  { id: "joelho-90-25mm", desc: "Joelho 90 graus 25 mm soldável" },
  { id: "joelho-90-20mm", desc: "Joelho 90 graus 20 mm soldável" },
];

export function extractMm(desc = "") {
  const m = desc.toLowerCase().match(/(\d+(?:[\.,]\d+)?)\s*mm/);
  if (!m) return -Infinity;
  const n = Number(String(m[1]).replace(",", "."));
  return isNaN(n) ? -Infinity : n;
}

export function sortByMmDesc(arr) {
  return [...arr].sort((a, b) => {
    const da = extractMm(a.desc);
    const db = extractMm(b.desc);
    if (db !== da) return db - da;
    return a.desc.localeCompare(b.desc, "pt-BR");
  });
}
