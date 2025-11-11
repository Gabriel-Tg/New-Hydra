export const pad = (n) => n.toString().padStart(2, "0");
export const fmtDate = (d) => {
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};
export const fmtTime = (d) => {
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
export const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = (d) => { const x = new Date(d); const day = (x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; };
export const endOfWeek = (d) => addDays(startOfWeek(d), 6);
export const isSameDay = (a,b) => {
  const da=new Date(a), db=new Date(b);
  return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate();
};
export const isSameMonth = (a,b) => {
  const da=new Date(a), db=new Date(b);
  return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth();
};
export const rangeDays = (a,b) => {
  const res=[]; let cur=startOfDay(a); const end=endOfDay(b);
  while(cur<=end){ res.push(new Date(cur)); cur=addDays(cur,1); }
  return res;
};
