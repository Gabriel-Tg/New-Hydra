// utilitários de data robustos (JS Date puro)

export const pad = (n) => String(n).padStart(2, "0");

// garante Date a partir de number/string/Date
export const toDate = (d) => {
  if (d instanceof Date) return new Date(d);
  if (Number.isFinite(d)) return new Date(d);
  if (typeof d === "string") {
    const trimmed = d.trim();
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(trimmed);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]) - 1;
      const day = Number(m[3]);
      return new Date(year, month, day);
    }
    return new Date(trimmed);
  }
  return new Date(d);
};

// converte para YYYY-MM-DD em horario local
export const toISODate = (d) => {
  const x = toDate(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

export const toDateOnlyTs = (d) => {
  const x = toDate(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

export const fmtDate = (d) => {
  const x = toDate(d);
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
};

export const fmtTime = (d) => {
  const x = toDate(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export const addMinutes = (d, mins) => {
  const x = toDate(d);
  x.setMinutes(x.getMinutes() + Number(mins || 0));
  return x;
};

export const addDays = (d, n) => {
  const x = toDate(d);
  x.setDate(x.getDate() + Number(n || 0));
  return x;
};

export const startOfDay = (d) => {
  const x = toDate(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const endOfDay = (d) => {
  const x = toDate(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

// semana começando na segunda
export const startOfWeek = (d) => {
  const x = toDate(d);
  const dow = (x.getDay() + 6) % 7; // Mon=0 .. Sun=6
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const endOfWeek = (d) => addDays(startOfWeek(d), 6);

export const isSameDay = (a, b) => {
  const da = toDate(a), db = toDate(b);
  return da.getFullYear() === db.getFullYear()
      && da.getMonth() === db.getMonth()
      && da.getDate() === db.getDate();
};

export const isSameMonth = (a, b) => {
  const da = toDate(a), db = toDate(b);
  return da.getFullYear() === db.getFullYear()
      && da.getMonth() === db.getMonth();
};

export const rangeDays = (from, to) => {
  const res = [];
  let cur = startOfDay(from);
  const end = endOfDay(to);
  while (cur <= end) {
    res.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return res;
};
