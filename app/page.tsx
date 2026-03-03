"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, addDoc, query, where, onSnapshot, 
  deleteDoc, doc, updateDoc, serverTimestamp, orderBy 
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// 1. Definice typů pro TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Task {
  id: string;
  text: string;
  date: string;
  time?: string;
  status: 'todo' | 'in-progress' | 'done';
}

const COLUMNS = [
  { id: 'todo', title: 'K UDĚLÁNÍ', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'V PROCESU', color: 'bg-blue-50' },
  { id: 'done', title: 'HOTOVO', color: 'bg-green-50' }
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [task, setTask] = useState("");
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // 2. Sledování přihlášení
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 3. Načítání dat
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
  }, [user]);

  // 4. Logika Drag & Drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const taskDoc = doc(db, "tasks", draggableId);
    await updateDoc(taskDoc, { 
      status: destination.droppableId as Task['status'] 
    });
  };

  // 5. Hlasové ovládání
  const startListening = () => {
    const windowAny = window as any;
    const SpeechRec = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Váš prohlížeč nepodporuje hlasové zadávání.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'cs-CZ';
    recognition.onresult = (event: any) => {
      setTask(event.results[0][0].transcript);
    };
    recognition.start();
  };

  // 6. Odeslání do Firebase
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || !user) return;

    try {
      await addDoc(collection(db, "tasks"), {
        text: task,
        date: taskDate,
        time: taskTime,
        status: 'todo',
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setTask("");
      setTaskTime("");
    } catch (err) {
      console.error("Chyba při ukládání:", err);
    }
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-black">
      {!user ? (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <h1 className="text-4xl font-black mb-6 text-blue-600">KanbanPro ⚡</h1>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)} 
            className="bg-black text-white px-8 py-3 rounded-xl font-bold"
          >
            Přihlásit se přes Google
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-black">Moje Tabule</h1>
              <button onClick={() => signOut(auth)} className="text-xs text-red-500 font-bold">Odhlásit</button>
            </div>
            
            <form onSubmit={handleAddTask} className="bg-white p-3 rounded-2xl shadow-sm flex flex-wrap gap-2 border">
              <div className="relative flex-1 min-w-[200px]">
                <input 
                  value={task} 
                  onChange={e => setTask(e.target.value)} 
                  placeholder="Co je potřeba udělat?" 
                  className="w-full p-2 pr-10 outline-none" 
                />
                <button type="button" onClick={startListening} className="absolute right-2 top-1/2 -translate-y-1/2">🎙️</button>
              </div>
              <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="p-2 text-sm border-l" />
              <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} className="p-2 text-sm border-l" />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">+</button>
            </form>
          </header>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-6">
              {COLUMNS.map(col => (
                <Droppable key={col.id} droppableId={col.id}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 min-h-[400px] ${col.color} rounded-2xl p-4`}>
                      <h2 className="text-xs font-black text-slate-400 mb-4 tracking-widest uppercase">{col.title}</h2>
                      <div className="space-y-3">
                        {tasks.filter(t => t.status === col.id).map((t, index) => (
                          <Draggable key={t.id} draggableId={t.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-4 rounded-xl shadow-sm relative group border">
                                <p className="font-semibold text-slate-800">{t.text}</p>
                                <div className="flex gap-3 mt-2 text-[10px] font-bold uppercase">
                                  <span className="text-blue-500">📅 {t.date}</span>
                                  {t.time && <span className="text-red-500">⏰ {t.time}</span>}
                                </div>
                                <button onClick={() => deleteTask(t.id)} className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}
    </main>
  );
}