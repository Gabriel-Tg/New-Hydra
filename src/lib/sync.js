import { db } from "./db";
import { supabase } from "./supabase"; // se ainda não tem, deixe pra depois

export async function processOutbox() {
  if (!navigator.onLine) return;

  const items = await db.outbox.toArray();
  for (const i of items) {
    try {
      if (i.kind === "insert-receivable") {
        const { payload } = i;
        const { error } = await supabase.from("receivables").insert(payload);
        if (error) throw error;
      }
      if (i.kind === "mark-paid-receivable") {
        const { id } = i.payload;
        const { error } = await supabase.from("receivables").update({ status: "paid" }).eq("id", id);
        if (error) throw error;
      }
      // adicione outros tipos (appts/pagáveis etc.)

      await db.outbox.delete(i._id); // remove da fila se deu certo
    } catch (err) {
      // mantém na fila – tenta depois
      console.warn("Falha ao sincronizar item da outbox:", err);
      // pode dar break para tentar em próxima conexão
      break;
    }
  }
}

export function setupOnlineSync() {
  window.addEventListener("online", () => processOutbox());
  // tentativas periódicas
  setInterval(processOutbox, 15_000);
}
