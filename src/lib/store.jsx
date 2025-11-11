import { create } from "zustand";
import { addDays } from "./date.jsx";

const today = new Date();

const MOCK_CLIENTS = [
  { id: "c1", name: "Ana Souza", phone: "(11) 90000-0001", address: "Av. Central, 100" },
  { id: "c2", name: "Bruno Lima", phone: "(11) 90000-0002", address: "Rua das Flores, 200" },
  { id: "c3", name: "Carla Nunes", phone: "(11) 90000-0003", address: "Alameda Azul, 300" },
];

const MOCK_SERVICES = [
  { id: "s1", name: "Instalação", duration: 90, price: 250 },
  { id: "s2", name: "Manutenção", duration: 60, price: 180 },
  { id: "s3", name: "Visita Técnica", duration: 45, price: 120 },
];

const MOCK_APPTS = [
  { id: "a1", client_id: "c1", service_id: "s1", start_at: addDays(today,0).setHours(9,0,0,0),   end_at: addDays(today,0).setHours(10,30,0,0), status: "confirmed", location: "Av. Central, 100", notes: "Levar furadeira" },
  { id: "a2", client_id: "c2", service_id: "s2", start_at: addDays(today,0).setHours(13,30,0,0), end_at: addDays(today,0).setHours(14,30,0,0), status: "pending",   location: "Rua das Flores, 200", notes: "Pedir autorização" },
  { id: "a3", client_id: "c3", service_id: "s3", start_at: addDays(today,1).setHours(10,0,0,0),  end_at: addDays(today,1).setHours(10,45,0,0), status: "confirmed", location: "Alameda Azul, 300", notes: "Estacionamento difícil" },
  { id: "a4", client_id: "c1", service_id: "s2", start_at: addDays(today,3).setHours(15,0,0,0),  end_at: addDays(today,3).setHours(16,0,0,0), status: "confirmed", location: "Av. Central, 100", notes: "Trocar filtro" },
];

const MOCK_RECEIVABLES = [
  { id: "r1", customer: "Ana Souza",   due_date: addDays(today,0),  amount: 250, status: "open",    method: "pix" },
  { id: "r2", customer: "Bruno Lima",  due_date: addDays(today,2),  amount: 180, status: "open",    method: "card" },
  { id: "r3", customer: "Carla Nunes", due_date: addDays(today,-2), amount: 120, status: "overdue", method: "cash" },
];

const MOCK_PAYABLES = [
  { id: "p1", description: "Aluguel",    due_date: addDays(today,4), amount: 800, status: "open", category: "Fixo" },
  { id: "p2", description: "Internet",   due_date: addDays(today,1), amount: 120, status: "open", category: "Fixo" },
  { id: "p3", description: "Combustível",due_date: addDays(today,0), amount: 150, status: "open", category: "Variável" },
];

export const useStore = create((set) => ({
  appts: MOCK_APPTS,
  receivables: MOCK_RECEIVABLES,
  payables: MOCK_PAYABLES,
  clients: MOCK_CLIENTS,
  services: MOCK_SERVICES,
  markApptDone: (id) => set((s) => ({ appts: s.appts.map(a => a.id===id ? { ...a, status: "done" } : a) })),
  markRecPaid: (id) => set((s) => ({ receivables: s.receivables.map(r => r.id===id ? { ...r, status: "paid" } : r) })),
  markPayPaid: (id) => set((s) => ({ payables: s.payables.map(p => p.id===id ? { ...p, status: "paid" } : p) })),
}));
