import Dexie from "dexie";

export const db = new Dexie("prestador-db");
db.version(1).stores({
  appts: "id, client_id, start_at, updated_at",        // dados locais
  receivables: "id, due_date, updated_at",
  payables: "id, due_date, updated_at",
  outbox: "++_id, kind, payload, created_at"           // FILA offline
});
