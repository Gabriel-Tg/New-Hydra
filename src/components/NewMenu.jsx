import React, { useState } from "react";
import Modal from "./Modal.jsx";
import ClientAutocomplete from "./ClientAutocomplete.jsx";
import { useStore } from "../lib/store.jsx";
import { addMinutes } from "../lib/date.jsx";

export default function NewMenu(){
  const [type, setType] = useState(null);
  const closeAll = () => setType(null);

  return (
    <>
      {/* FAB */}
      <div style={{ position:"fixed", right:16, bottom:88, zIndex:50 }}>
        <button className="btn primary" onClick={()=>setType("menu")}>+ Novo</button>
      </div>

      {/* Modal central com 3 opções (grande e centralizado) */}
      <Modal open={type==="menu"} onClose={closeAll} title="Criar novo">
        <div style={{display:"grid", gap:12}}>
          <button className="btn" onClick={()=>setType("appt")}>Agendar com cliente</button>
          <button className="btn" onClick={()=>setType("rec")}>Adicionar a receber</button>
          <button className="btn" onClick={()=>setType("pay")}>Adicionar a pagar</button>
        </div>
      </Modal>

      <NewAppointment open={type==="appt"} onClose={closeAll} />
      <NewReceivable open={type==="rec"} onClose={closeAll} />
      <NewPayable open={type==="pay"} onClose={closeAll} />
    </>
  );
}

/* ---------- Forms ---------- */

function NewAppointment({ open, onClose }){
  const add = useStore(s=>s.addAppointment);
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [service, setService] = useState("Visita Técnica");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const endTime = addMinutes(new Date(`${date}T${start}:00`), Number(duration));
    add({
      client_name: clientName,
      service,
      date,
      start,
      end: `${String(endTime.getHours()).padStart(2,"0")}:${String(endTime.getMinutes()).padStart(2,"0")}`,
      location, notes
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento">
      <form className="stack" onSubmit={submit}>
        <ClientAutocomplete value={clientName} onChange={setClientName} />
        <div className="row">
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} />
          <input className="input" type="number" min="15" step="15" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duração (min)" />
        </div>
        <input className="input" value={service} onChange={e=>setService(e.target.value)} placeholder="Serviço" />
        <input className="input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Local (opcional)" />
        <textarea className="input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas" style={{minHeight:80}} />
        <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

function NewReceivable({ open, onClose }){
  const add = useStore(s=>s.addReceivable);
  const [customer, setCustomer] = useState("");
  const [due, setDue] = useState(()=> new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("pix");

  const submit = (e) => {
    e.preventDefault();
    add({ customer, due_date: due, amount, method });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo a receber">
      <form className="stack" onSubmit={submit}>
        <ClientAutocomplete value={customer} onChange={setCustomer} placeholder="Cliente" />
        <div className="row">
          <input className="input" type="date" value={due} onChange={e=>setDue(e.target.value)} />
          <input className="input" type="number" step="0.01" placeholder="Valor (R$)" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <select className="input" value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="pix">Pix</option>
          <option value="card">Cartão</option>
          <option value="cash">Dinheiro</option>
          <option value="boleto">Boleto</option>
        </select>
        <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

function NewPayable({ open, onClose }){
  const add = useStore(s=>s.addPayable);
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(()=> new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Geral");

  const submit = (e) => {
    e.preventDefault();
    add({ description, due_date: due, amount, category });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo a pagar">
      <form className="stack" onSubmit={submit}>
        <input className="input" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="row">
          <input className="input" type="date" value={due} onChange={e=>setDue(e.target.value)} />
          <input className="input" type="number" step="0.01" placeholder="Valor (R$)" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <input className="input" placeholder="Categoria" value={category} onChange={e=>setCategory(e.target.value)} />
        <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
