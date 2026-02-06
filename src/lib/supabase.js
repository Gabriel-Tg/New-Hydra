// npm i @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // Always require login after reload.
    persistSession: false,
  },
});

// inserir um cliente
export async function createClientRecord(user_id, { name, phone, cnpj, address }) {
  const { data, error } = await supabase
    .from("clients")
    .insert([{ user_id, name, phone, cnpj, address }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// buscar catálogo (ordenado por size_mm desc, description)
export async function fetchCatalog(q) {
  let query = supabase.from("catalog_items").select("*");
  if (q) {
    query = query.ilike("description", `%${q}%`);
  }
  const { data, error } = await query.order("size_mm", { ascending: false }).order("description");
  if (error) throw error;
  return data || [];
}

// criar pedido e itens (transaction-like)
export async function createOrder(user_id, orderPayload, items) {
  // insere order
  const { data: order, error: e1 } = await supabase
    .from("orders")
    .insert([{ user_id, ...orderPayload }])
    .select()
    .single();
  if (e1) throw e1;
  // insere itens (associa order.id)
  const itemsToInsert = items.map(it => ({ order_id: order.id, ...it }));
  const { error: e2 } = await supabase.from("order_items").insert(itemsToInsert);
  if (e2) throw e2;
  return order;
}
