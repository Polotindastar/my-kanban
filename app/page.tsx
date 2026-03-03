"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, addDoc, query, where, onSnapshot, 
  deleteDoc, doc, updateDoc, serverTimestamp, orderBy 
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
interface Window {
SpeechRecognition?: any;
webkitSpeechRecognition?: any;
}
interface Task {
  id: string;
  text: string;
  date: string;
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
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
  }, [user]);

  // LOGIKA PŘETAŽENÍ
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return; // Puštěno mimo sloupec
    if (destination.droppableId === source.droppableId) return; // Puštěno ve stejném sloupci

    // Aktualizace stavu ve Firebase
    const taskDoc = doc(db, "tasks", draggableId);
    await updateDoc(taskDoc, { 
      status: destination.droppableId as Task['status'] 
    });
  };
const startListening = () => {

const windowAny = window as any;

const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;

if (!SpeechRecognition) {

alert("Váš prohlížeč nepodporuje hlasové zadávání.");

return;

}

const recognition = new SpeechRecognition();

recognition.lang = 'cs-CZ';

recognition.start();

recognition.onresult = (event: any) => {

const transcript = event.results[0][0].transcript;

setTask(transcript);

};

};

const processVoiceInput = (text: string) => {
  let note = text;
  let dateObj = new Date();

  // Inteligentní parsování data z hlasu
  if (text.toLowerCase().includes("zítra")) {
    note = text.replace(/zítra/gi, "").trim();
    dateObj.setDate(dateObj.getDate() + 1);
  } else if (text.toLowerCase().includes("pondělí")) {
    // Jednoduchá ukázka, lze rozšířit
    note = text.replace(/pondělí/gi, "").trim();
  }

  setTask(note);
  setTaskDate(dateObj.toISOString().split('T')[0]);
};
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || !user) return;
    await addDoc(collection(db, "tasks"), {
      text: task,
      date: taskDate,
      status: 'todo',
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    setTask("");
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-black">
      {!user ? (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent text-black">
            KanbanPro ⚡
          </h1>
          <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl shadow-2xl font-bold hover:scale-105 transition">
            Začít s Google účtem
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <h1 className="text-3xl font-black text-slate-800">Moje Tabule</h1>
<form onSubmit={handleAddTask} className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto">
  <div className="relative flex-1 min-w-[200px]">
    <input 
      value={task} 
      onChange={e => setTask(e.target.value)} 
      placeholder="Nový úkol nebo hlasem..." 
      className="w-full p-2 pr-10 outline-none text-black" 
    />
    {/* Tlačítko pro hlasové zadávání zpět na scéně */}
    <button 
      type="button" 
      onClick={startListening}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition grayscale hover:grayscale-0"
      title="Hlasové zadávání"
    >
      🎙️
    </button>
  </div>
  
  <input 
    type="date" 
    value={taskDate} 
    onChange={e => setTaskDate(e.target.value)} 
    className="p-2 text-sm border-l text-black outline-none" 
  />
  
  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition">
    +
  </button>
</form>
            <div className="flex items-center gap-4">
               <span className="text-sm font-bold text-slate-500">{user.displayName}</span>
               <button onClick={() => signOut(auth)} className="text-red-400 text-xs font-bold hover:underline">Odhlásit</button>
            </div>
          </header>

          {/* Drag and Drop Area */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {COLUMNS.map(col => (
                <Droppable key={col.id} droppableId={col.id}>
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`flex-1 w-full min-h-[500px] ${col.color} rounded-2xl p-4 transition-colors`}
                    >
                      <h2 className="text-sm font-black text-slate-400 mb-4 tracking-widest uppercase px-2">
                        {col.title} ({tasks.filter(t => t.status === col.id).length})
                      </h2>
                      
                      <div className="space-y-3">
                        {tasks.filter(t => t.status === col.id).map((t, index) => (
                          <Draggable key={t.id} draggableId={t.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative"
                              >
                                <p className="text-slate-800 font-semibold pr-6">{t.text}</p>
                                <p className="text-[10px] text-blue-500 font-bold mt-2 uppercase tracking-tight">📅 {t.date}</p>
                                <button 
                                  onClick={() => deleteTask(t.id)} 
                                  className="absolute top-4 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  🗑️
                                </button>
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