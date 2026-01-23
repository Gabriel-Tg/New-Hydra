import { create } from "zustand";
import { parseToCents, formatCents } from "./money.js";
import { AppointmentSchema, PayableSchema, ReceivableSchema, validate } from "./validation.js";

const uid = (p="id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

// Em memória por padrão. Persistência segura deve usar Dexie + criptografia vinculada ao usuário autenticado.
const initial = {
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
    set({ uiToasts: [...get().uiToasts, { id, type:t.type||"success", title:t.title||"", desc:t.desc||"" }] });
    setTimeout(() => {
      set({ uiToasts: get().uiToasts.filter(x => x.id !== id) });
    }, t.ttl ?? 2200);
  };

  return {
    ...initial,

    /* UI */
    pushToast,

    /* Clients */
    addClientIfMissing: (name) => {
      if (!name?.trim()) return null;
      const s = get();
      const found = s.clients.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
      if (found) return found.id;
      const id = uid("c");
      const clients = [...s.clients, { id, name: name.trim(), phone:"", address:"", created_at: Date.now() }];
      save({ clients });
      return id;
    },

    /* Appointments */
    addAppointment: (data) => {
      const payload = validate(AppointmentSchema, data);
      const s = get();
      const client_id = data.client_id || get().addClientIfMissing(payload.client_name);
      const start_at = new Date(`${payload.date}T${payload.start}:00`).getTime();
      const end_at = new Date(`${payload.date}T${payload.end}:00`).getTime();
      if (end_at <= start_at) throw new Error("Hora final deve ser maior que a inicial");
      const appt = {
        id: uid("a"),
        client_id,
        service: payload.service,
        start_at,
        end_at,
        status: "pending",
        location: payload.location || "",
        notes: payload.notes || "",
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const appts = [...s.appts, appt];
      save({ appts });
      pushToast({ title:"Agendamento salvo!" });
    },
    confirmAppointment: (id) => {
      const appts = get().appts.map(a => a.id===id ? { ...a, status:"confirmed", updated_at: Date.now() } : a);
      save({ appts });
      pushToast({ title:"Agendamento confirmado" });
    },
    rescheduleAppointment: (id, { date, start, end }) => {
      const start_at = new Date(`${date}T${start}:00`).getTime();
      const end_at = new Date(`${date}T${end}:00`).getTime();
      if (end_at <= start_at) throw new Error("Hora final deve ser maior que a inicial");
      const appts = get().appts.map(a => a.id===id ? { ...a, start_at, end_at, status:"confirmed", updated_at: Date.now() } : a);
      save({ appts });
      pushToast({ title:"Reagendado com sucesso" });
    },
    completeAppointment: (id) => {
      const appts = get().appts.map(a => a.id===id ? { ...a, status:"done", completed_at: Date.now(), updated_at: Date.now() } : a);
      save({ appts });
      pushToast({ title:"Atendimento concluído" });
    },

    /* Receivables */
    addReceivable: (data) => {
      const payload = validate(ReceivableSchema, data);
      const s = get();
      const client_id = get().addClientIfMissing(payload.customer);
      const rec = {
        id: uid("r"),
        customer: payload.customer,
        client_id,
        due_date: new Date(`${payload.due_date}T00:00:00`).getTime(),
        amount_cents: parseToCents(payload.amount),
        status: "open",
        method: payload.method,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const receivables = [...s.receivables, rec];
      save({ receivables });
      pushToast({ title:"Recebível adicionado" });
    },
    markRecPaid: (id, paid_at) => {
      const paidAt = paid_at || Date.now();
      const receivables = get().receivables.map(r => r.id===id ? { ...r, status:"paid", paid_at: paidAt, updated_at: Date.now() } : r);
      save({ receivables });
      pushToast({ title:"Recebível marcado como pago" });
    },

    /* Payables */
    addPayable: (data) => {
      const payload = validate(PayableSchema, data);
      const s = get();
      const pay = {
        id: uid("p"),
        description: payload.description,
        due_date: new Date(`${payload.due_date}T00:00:00`).getTime(),
        amount_cents: parseToCents(payload.amount),
        status: "open",
        category: payload.category || "Geral",
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const payables = [...s.payables, pay];
      save({ payables });
      pushToast({ title:"Conta a pagar adicionada" });
    },
    markPayPaid: (id, paid_at) => {
      const paidAt = paid_at || Date.now();
      const payables = get().payables.map(p => p.id===id ? { ...p, status:"paid", paid_at: paidAt, updated_at: Date.now() } : p);
      save({ payables });
      pushToast({ title:"Pagamento efetuado" });
    },

    /* Cash flow */
    setCashOpening: (ym, value) => {
      const cents = parseToCents(value);
      const cashOpening = { ...get().cashOpening, [ym]: cents };
      save({ cashOpening });
      pushToast({ title:`Saldo inicial atualizado (${ym})` });
    },
  };
});
