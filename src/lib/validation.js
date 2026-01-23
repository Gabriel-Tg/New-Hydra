import { z } from "zod";
import { parseToCents } from "./money.js";

export const ReceivableSchema = z.object({
  customer: z.string().trim().min(1, "Cliente é obrigatório"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Data inválida"),
  amount: z.union([z.string(), z.number()]),
  method: z.enum(["pix","card","cash","boleto"])
});

export const PayableSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Data inválida"),
  amount: z.union([z.string(), z.number()]),
  category: z.string().trim().default("Geral")
});

export const AppointmentSchema = z.object({
  client_name: z.string().trim().min(1, "Cliente é obrigatório"),
  service: z.string().trim().min(1, "Serviço é obrigatório"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Data inválida"),
  start: z.string().regex(/^\d{2}:\d{2}$/,"Hora inicial inválida"),
  end: z.string().regex(/^\d{2}:\d{2}$/,"Hora final inválida"),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export function safeParseCents(value){
  try { return parseToCents(value); } catch (err) { throw err; }
}

export function validate(schema, payload){
  const res = schema.safeParse(payload);
  if (!res.success) {
    const msg = res.error?.errors?.[0]?.message || "Dados inválidos";
    throw new Error(msg);
  }
  return res.data;
}
