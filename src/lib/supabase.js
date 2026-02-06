// npm i @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const KEEP_KEY = "auth:keepLoggedIn";
const memoryStore = {};
const hasWindow = typeof window !== "undefined";

const getKeepLoggedIn = () => {
  if (!hasWindow) return true;
  try {
    return window.localStorage.getItem(KEEP_KEY) !== "false";
  } catch {
    return true;
  }
};

const storage = {
  getItem: (key) => {
    if (!hasWindow) return memoryStore[key] ?? null;
    const keep = getKeepLoggedIn();
    try {
      const store = keep ? window.localStorage : window.sessionStorage;
      return store.getItem(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  setItem: (key, value) => {
    if (!hasWindow) {
      memoryStore[key] = value;
      return;
    }
    const keep = getKeepLoggedIn();
    try {
      const store = keep ? window.localStorage : window.sessionStorage;
      store.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },
  removeItem: (key) => {
    if (!hasWindow) {
      delete memoryStore[key];
      return;
    }
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      delete memoryStore[key];
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    storage,
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
