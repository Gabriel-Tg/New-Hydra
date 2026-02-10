import { create } from "zustand";
import { parseToCents } from "./money.js";
import { AppointmentSchema, PayableSchema, ReceivableSchema, validate } from "./validation.js";
import { supabase } from "./supabase.js";

const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const formatSupabaseError = (err) => {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
  return parts.length ? parts.join(" | ") : "Erro desconhecido";
};

const initial = {
  session: null,
  user: null,
  clients: [],
  appts: [],
  receivables: [],
  payables: [],
  cashOpening: {},
  uiToasts: [],
};

export const useStore = create((set, get) => {
  const save = (partial) => set(partial);

  const pushToast = (t) => {
    const id = uid("toast");
    set({ uiToasts: [...get().uiToasts, { id, type: t.type || "success", title: t.title || "", desc: t.desc || "" }] });
    setTimeout(() => {
      set({ uiToasts: get().uiToasts.filter((x) => x.id !== id) });
    }, t.ttl ?? 2200);
  };

  const getUserId = () => get().user?.id || null;

  const setSession = (session) => {
    if (!session) {
      save({ ...initial, uiToasts: get().uiToasts });
      return;
    }
    save({ session, user: session.user });
  };

  const loadAll = async (user_id) => {
    console.log("loadAll called for user_id:", user_id);
    const [clientsRes, apptsRes, receivablesRes, payablesRes, openingRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("appts").select("*"),
      supabase.from("receivables").select("*"),
      supabase.from("payables").select("*"),
      supabase.from("cash_opening").select("*"),
    ]);
    console.log("loadAll responses:", {
      clients: clientsRes?.data?.length ?? 0,
      appts: apptsRes?.data?.length ?? 0,
      receivables: receivablesRes?.data?.length ?? 0,
      payables: payablesRes?.data?.length ?? 0,
      opening: openingRes?.data?.length ?? 0,
      clientsResError: clientsRes?.error,
      receivablesResError: receivablesRes?.error,
      payablesResError: payablesRes?.error,
    });

    if (clientsRes.error) throw new Error(formatSupabaseError(clientsRes.error));
    if (apptsRes.error) throw new Error(formatSupabaseError(apptsRes.error));
    if (receivablesRes.error) throw new Error(formatSupabaseError(receivablesRes.error));
    if (payablesRes.error) throw new Error(formatSupabaseError(payablesRes.error));
    if (openingRes.error) throw new Error(formatSupabaseError(openingRes.error));

    const cashOpening = (openingRes.data || []).reduce((acc, row) => {
      acc[row.ym] = Number(row.amount_cents || 0);
      return acc;
    }, {});

    save({
      clients: clientsRes.data || [],
      appts: apptsRes.data || [],
      receivables: receivablesRes.data || [],
      payables: payablesRes.data || [],
      cashOpening,
    });
  };

  return {
    ...initial,

    /* UI */
    pushToast,
    resetAll: () => save({ ...initial, uiToasts: get().uiToasts }),
    setSession,
    loadAll,

    /* Clients */
    addClientIfMissing: async (name) => {
      if (!name?.trim()) return null;
      const s = get();
      const lowered = name.trim().toLowerCase();
      const found = s.clients.find((c) => c.name.toLowerCase() === lowered);
      if (found) return found.id;

      const user_id = getUserId();
      const { data, error } = await supabase
        .from("clients")
        .upsert({ user_id, name: name.trim(), phone: "", address: "", cnpj: "" }, { onConflict: "user_id,name" })
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ clients: [...get().clients, data] });
      return data.id;
    },

    /* Appointments */
    addAppointment: async (data) => {
      const payload = validate(AppointmentSchema, data);
      const user_id = getUserId();
      const client_id = data.client_id || await get().addClientIfMissing(payload.client_name);
      const start_at = new Date(`${payload.date}T${payload.start}:00`).getTime();
      const end_at = new Date(`${payload.date}T${payload.end}:00`).getTime();
      if (end_at <= start_at) throw new Error("Hora final deve ser maior que a inicial");
      const appt = {
        user_id,
        client_id,
        service: payload.service,
        start_at,
        end_at,
        status: "pending",
        location: payload.location || "",
        notes: payload.notes || "",
      };
      const { data: row, error } = await supabase.from("appts").insert(appt).select().single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ appts: [...get().appts, row] });
      pushToast({ title: "Agendamento salvo!" });
    },
    confirmAppointment: async (id) => {
      const { data: row, error } = await supabase
        .from("appts")
        .update({ status: "confirmed" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ appts: get().appts.map((a) => (a.id === id ? row : a)) });
      pushToast({ title: "Agendamento confirmado" });
    },
    rescheduleAppointment: async (id, { date, start, end }) => {
      const start_at = new Date(`${date}T${start}:00`).getTime();
      const end_at = new Date(`${date}T${end}:00`).getTime();
      if (end_at <= start_at) throw new Error("Hora final deve ser maior que a inicial");
      const { data: row, error } = await supabase
        .from("appts")
        .update({ start_at, end_at, status: "confirmed" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ appts: get().appts.map((a) => (a.id === id ? row : a)) });
      pushToast({ title: "Reagendado com sucesso" });
    },
    completeAppointment: async (id) => {
      const { data: row, error } = await supabase
        .from("appts")
        .update({ status: "done", completed_at: Date.now() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ appts: get().appts.map((a) => (a.id === id ? row : a)) });
      pushToast({ title: "Atendimento concluido" });
    },

    /* Receivables */
    addReceivable: async (data) => {
      const payload = validate(ReceivableSchema, data);
      const user_id = getUserId();
      const client_id = await get().addClientIfMissing(payload.customer);
      const status = payload.status || "open";
      const paid_at = status === "paid" ? (payload.paid_at || Date.now()) : null;
      const rec = {
        user_id,
        customer: payload.customer,
        client_id,
        description: payload.description || "",
        due_date: payload.due_date,
        amount_cents: parseToCents(payload.amount),
        status,
        method: payload.method,
        paid_at,
      };
      console.log("addReceivable payload ->", rec);
      const { data: row, error } = await supabase.from("receivables").insert(rec).select().single();
      console.log("addReceivable result ->", { row, error });
      if (error) throw new Error(formatSupabaseError(error));
      save({ receivables: [...get().receivables, row] });
      pushToast({ title: "Recebivel adicionado" });
    },
    markRecPaid: async (id, paid_at) => {
      const paidAt = paid_at || Date.now();
      const { data: row, error } = await supabase
        .from("receivables")
        .update({ status: "paid", paid_at: paidAt })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ receivables: get().receivables.map((r) => (r.id === id ? row : r)) });
      pushToast({ title: "Recebivel marcado como pago" });
    },
    updateReceivable: async (id, data) => {
      const payload = validate(ReceivableSchema, data);
      const current = get().receivables.find((r) => r.id === id);
      const status = payload.status || "open";
      const paid_at = status === "paid" ? (payload.paid_at ?? current?.paid_at ?? Date.now()) : null;
      const client_id = await get().addClientIfMissing(payload.customer);
      const updates = {
        customer: payload.customer,
        client_id,
        description: payload.description || "",
        due_date: payload.due_date,
        amount_cents: parseToCents(payload.amount),
        status,
        method: payload.method,
        paid_at,
      };
      const { data: row, error } = await supabase
        .from("receivables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ receivables: get().receivables.map((r) => (r.id === id ? row : r)) });
      pushToast({ title: "Recebivel atualizado" });
    },
    removeReceivable: async (id) => {
      const { error } = await supabase.from("receivables").delete().eq("id", id);
      if (error) throw new Error(formatSupabaseError(error));
      save({ receivables: get().receivables.filter((r) => r.id !== id) });
      pushToast({ title: "Recebivel removido" });
    },

    /* Payables */
    addPayable: async (data) => {
      const payload = validate(PayableSchema, data);
      const user_id = getUserId();
      const status = payload.status || "open";
      const paid_at = status === "paid" ? (payload.paid_at || Date.now()) : null;
      const pay = {
        user_id,
        description: payload.description,
        due_date: payload.due_date,
        amount_cents: parseToCents(payload.amount),
        status,
        category: payload.category || "Geral",
        method: payload.method,
        paid_at,
      };
      console.log("addPayable payload ->", pay);
      const { data: row, error } = await supabase.from("payables").insert(pay).select().single();
      console.log("addPayable result ->", { row, error });
      if (error) throw new Error(formatSupabaseError(error));
      save({ payables: [...get().payables, row] });
      pushToast({ title: "Conta a pagar adicionada" });
    },
    markPayPaid: async (id, paid_at) => {
      const paidAt = paid_at || Date.now();
      const { data: row, error } = await supabase
        .from("payables")
        .update({ status: "paid", paid_at: paidAt })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ payables: get().payables.map((p) => (p.id === id ? row : p)) });
      pushToast({ title: "Pagamento efetuado" });
    },
    updatePayable: async (id, data) => {
      const payload = validate(PayableSchema, data);
      const current = get().payables.find((p) => p.id === id);
      const status = payload.status || "open";
      const paid_at = status === "paid" ? (payload.paid_at ?? current?.paid_at ?? Date.now()) : null;
      const updates = {
        description: payload.description,
        due_date: payload.due_date,
        amount_cents: parseToCents(payload.amount),
        status,
        category: payload.category || "Geral",
        method: payload.method,
        paid_at,
      };
      const { data: row, error } = await supabase
        .from("payables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError(error));
      save({ payables: get().payables.map((p) => (p.id === id ? row : p)) });
      pushToast({ title: "Pagamento atualizado" });
    },
    removePayable: async (id) => {
      const { error } = await supabase.from("payables").delete().eq("id", id);
      if (error) throw new Error(formatSupabaseError(error));
      save({ payables: get().payables.filter((p) => p.id !== id) });
      pushToast({ title: "Conta removida" });
    },

    /* Cash flow */
    setCashOpening: async (ym, value) => {
      const user_id = getUserId();
      const amount_cents = parseToCents(value);
      const { error } = await supabase
        .from("cash_opening")
        .upsert({ user_id, ym, amount_cents }, { onConflict: "user_id,ym" });
      if (error) throw new Error(formatSupabaseError(error));
      save({ cashOpening: { ...get().cashOpening, [ym]: amount_cents } });
      pushToast({ title: `Saldo inicial atualizado (${ym})` });
    },
  };
});
