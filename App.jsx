import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, CheckSquare, StickyNote, Send, Plus, Trash2, Loader2, X } from "lucide-react";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "tareas", label: "Tareas", icon: CheckSquare },
  { id: "notas", label: "Notas", icon: StickyNote },
];

const STAMP_ROTATIONS = ["-1.5deg", "1deg", "-0.5deg", "1.5deg", "0.5deg"];

function stampFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return STAMP_ROTATIONS[hash % STAMP_ROTATIONS.length];
}

function formatDate(ts) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) +
    " · " +
    d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  );
}

function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState(() => loadLocal("assistant:messages", []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState(() => loadLocal("assistant:tasks", []));
  const [notes, setNotes] = useState(() => loadLocal("assistant:notes", []));
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("assistant:messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("assistant:tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("assistant:notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text, id: crypto.randomUUID(), ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const system =
      "Eres un asistente personal con un estilo formal, ingenioso y ligeramente sarcástico, " +
      "al estilo de un mayordomo de inteligencia artificial impecable. " +
      "Te diriges al usuario como 'señor' o 'señora' con naturalidad, no en cada frase. " +
      "Mantienes la calma en cualquier situación, eres preciso, y añades un toque de humor seco cuando encaja. " +
      "Ayudas con productividad, organización y decisiones cotidianas. " +
      "Respondes en español, de forma breve y clara salvo que pidan más detalle. " +
      "Si el usuario menciona algo que suena a tarea pendiente o una nota que quiere guardar, " +
      "sugiéreselo al final, en una sola línea corta, invitándolo a guardarla en la pestaña de Tareas o Notas.";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const textOut =
        (data.content || [])
          .map((b) => (b.type === "text" ? b.text : ""))
          .filter(Boolean)
          .join("\n") || "No obtuve respuesta, intenta de nuevo.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: textOut, id: crypto.randomUUID(), ts: Date.now() },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hubo un problema al conectar. Intenta de nuevo en un momento.",
          id: crypto.randomUUID(),
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function addTask() {
    const text = newTask.trim();
    if (!text) return;
    setTasks((prev) => [{ id: crypto.randomUUID(), text, done: false, ts: Date.now() }, ...prev]);
    setNewTask("");
  }

  function addNote() {
    const text = newNote.trim();
    if (!text) return;
    setNotes((prev) => [{ id: crypto.randomUUID(), text, ts: Date.now() }, ...prev]);
    setNewNote("");
  }

  return (
    <div
      className="w-full h-screen flex overflow-hidden"
      style={{ background: "#EDE7DB", fontFamily: "'Inter', sans-serif", color: "#262320" }}
    >
      <div
        className="flex flex-col items-center py-6 gap-2 border-r"
        style={{ width: "76px", borderColor: "#D8CEB8", background: "#F7F3E9" }}
      >
        <div className="mb-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#3E6259" }}>
          <span style={{ fontFamily: "'Fraunces', serif", color: "#F7F3E9", fontSize: "16px" }}>a</span>
        </div>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl transition-colors"
              style={{ background: active ? "#3E6259" : "transparent", color: active ? "#F7F3E9" : "#5B564C" }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span style={{ fontSize: "10px", fontFamily: "'Inter', sans-serif" }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {tab === "chat" && (
          <>
            <div className="px-8 py-5 border-b" style={{ borderColor: "#D8CEB8" }}>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 600 }}>Tu asistente</h1>
              <p style={{ fontSize: "13px", color: "#6B665B" }}>Pregunta, organiza ideas o piensa en voz alta.</p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
              {messages.length === 0 && (
                <div style={{ color: "#8A8474", fontSize: "14px", fontStyle: "italic" }}>
                  Aún no hay conversación. Escribe algo abajo para empezar.
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className="max-w-[75%] px-4 py-3 rounded-2xl"
                    style={{
                      background: m.role === "user" ? "#3E6259" : "#F7F3E9",
                      color: m.role === "user" ? "#F7F3E9" : "#262320",
                      border: m.role === "user" ? "none" : "1px solid #D8CEB8",
                      fontSize: "14.5px",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 rounded-2xl flex items-center gap-2"
                    style={{ background: "#F7F3E9", border: "1px solid #D8CEB8", fontSize: "14px", color: "#6B665B" }}
                  >
                    <Loader2 size={14} className="animate-spin" /> pensando…
                  </div>
                </div>
              )}
            </div>
            <div className="px-8 py-5 border-t" style={{ borderColor: "#D8CEB8" }}>
              <div className="flex items-end gap-2 rounded-2xl px-3 py-2" style={{ background: "#F7F3E9", border: "1px solid #D8CEB8" }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none"
                  style={{ fontSize: "14.5px", color: "#262320", maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: input.trim() ? "#3E6259" : "#D8CEB8", color: "#F7F3E9" }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "tareas" && (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 600 }}>Tareas</h1>
            <p style={{ fontSize: "13px", color: "#6B665B", marginBottom: "20px" }}>
              Lo que tienes pendiente, en un solo lugar.
            </p>
            <div className="flex gap-2 mb-6">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Nueva tarea…"
                className="flex-1 px-4 py-2 rounded-xl outline-none"
                style={{ background: "#F7F3E9", border: "1px solid #D8CEB8", fontSize: "14px" }}
              />
              <button onClick={addTask} className="px-4 rounded-xl flex items-center gap-1" style={{ background: "#3E6259", color: "#F7F3E9", fontSize: "13px" }}>
                <Plus size={15} /> Añadir
              </button>
            </div>
            {tasks.length === 0 && <p style={{ color: "#8A8474", fontSize: "14px", fontStyle: "italic" }}>No tienes tareas guardadas todavía.</p>}
            <div className="flex flex-col gap-3">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#F7F3E9", border: "1px solid #D8CEB8", transform: `rotate(${stampFor(t.id)})` }}
                >
                  <button
                    onClick={() => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ border: "1.5px solid #3E6259", background: t.done ? "#3E6259" : "transparent" }}
                  >
                    {t.done && <span style={{ color: "#F7F3E9", fontSize: "12px" }}>✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "14.5px", textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9A9484" : "#262320" }}>
                      {t.text}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#8A8474" }}>{formatDate(t.ts)}</div>
                  </div>
                  <button onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))} style={{ color: "#B08968" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "notas" && (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 600 }}>Notas</h1>
            <p style={{ fontSize: "13px", color: "#6B665B", marginBottom: "20px" }}>Ideas, datos y cosas que quieres recordar.</p>
            <div className="flex gap-2 mb-6 items-start">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Nueva nota…"
                rows={2}
                className="flex-1 px-4 py-2 rounded-xl outline-none resize-none"
                style={{ background: "#F7F3E9", border: "1px solid #D8CEB8", fontSize: "14px" }}
              />
              <button onClick={addNote} className="px-4 py-2 rounded-xl flex items-center gap-1 flex-shrink-0" style={{ background: "#C68A3D", color: "#FBF7EF", fontSize: "13px" }}>
                <Plus size={15} /> Guardar
              </button>
            </div>
            {notes.length === 0 && <p style={{ color: "#8A8474", fontSize: "14px", fontStyle: "italic" }}>No tienes notas guardadas todavía.</p>}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 rounded-lg relative"
                  style={{ background: "#FBF3DE", border: "1px solid #E3D6A8", transform: `rotate(${stampFor(n.id)})`, boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
                >
                  <button onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))} className="absolute top-2 right-2" style={{ color: "#B08968" }}>
                    <X size={13} />
                  </button>
                  <div style={{ fontSize: "14px", paddingRight: "16px", whiteSpace: "pre-wrap" }}>{n.text}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "#9A8B5C", marginTop: "8px" }}>{formatDate(n.ts)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
