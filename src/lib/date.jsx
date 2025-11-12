// utilitários de data robustos (JS Date puro)

export const pad = (n) => String(n).padStart(2, "0");

// garante Date a partir de number/string/Date
export const toDate = (d) =>
  (d instanceof Date ? new Date(d) : new Date(Number.isFinite(d) ? d : d));

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
