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

interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

interface Task {
  id: string;
  text: string;
  date: string;
  time?: string;
  status: 'todo' | 'in-progress' | 'done';
  subtasks?: SubTask[]; // Pole podúkolů
}

const COLUMNS = [
  { id: 'todo', title: 'K UDĚLÁNÍ', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'V PROCESU', color: 'bg-blue-50' },
  { id: 'done', title: 'HOTOVO', color: 'bg-green-50' }
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [task, setTask] = useState("");
  const [tempSubtasks, setTempSubtasks] = useState<string[]>([]);
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

  const addSubTask = async (taskId: string, subTaskText: string) => {
  if (!subTaskText.trim()) return;
  const taskRef = doc(db, "tasks", taskId);
  const currentTask = tasks.find(t => t.id === taskId);
  const newSubTask: SubTask = {
    id: Date.now().toString(),
    text: subTaskText,
    completed: false
  };
  
  await updateDoc(taskRef, {
    subtasks: [...(currentTask?.subtasks || []), newSubTask]
  });
};

const toggleSubTask = async (taskId: string, subTaskId: string) => {
  const taskRef = doc(db, "tasks", taskId);
  const currentTask = tasks.find(t => t.id === taskId);
  if (!currentTask?.subtasks) return;

  const updatedSubTasks = currentTask.subtasks.map(st => 
    st.id === subTaskId ? { ...st, completed: !st.completed } : st
  );

  await updateDoc(taskRef, { subtasks: updatedSubTasks });
};

  // 4. Logika Drag & Drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const taskDoc = doc(db, "tasks", draggableId);
    await updateDoc(taskDoc, { 
      status: destination.droppableId as Task['status'] 
    });
  };

const improveWithAI = async () => {
  if (!task.trim()) return;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: task }),
    });

    const data = await res.json();
    
    if (data.text) {
      setTask(data.text);
      // Tady se uloží ty podúkoly do paměti
      if (data.subtasks) {
        setTempSubtasks(data.subtasks);
        console.log("AI navrhla podúkoly:", data.subtasks);
      }
    }
  } catch (err) {
    console.error("Chyba AI:", err);
  }
};

const extractTimeFromText = (text: string) => {
    const t = text.toLowerCase();
    
    // 1. Zkusíme najít klasický formát čísel (např. 14:30 nebo 14.30)
    const digitalMatch = t.match(/(\d{1,2})[:.](\d{2})/);
    if (digitalMatch) {
      return `${digitalMatch[1].padStart(2, '0')}:${digitalMatch[2]}`;
    }

    // 2. Zkusíme najít dvě čísla vedle sebe (např. "ve čtrnáct třicet" -> "14 30")
    // Hledáme dvě skupiny čísel oddělené mezerou
    const wordsMatch = t.match(/(\d{1,2})\s(\d{2})/);
    if (wordsMatch) {
      return `${wordsMatch[1].padStart(2, '0')}:${wordsMatch[2]}`;
    }

    // 3. Zkusíme najít jen celou hodinu (např. "v deset")
    const hourMatch = t.match(/ve?\s(\d{1,2})/);
    if (hourMatch) {
      return `${hourMatch[1].padStart(2, '0')}:00`;
    }

    return null;
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
     let transcript = event.results[0][0].transcript;
     
      
      // Pokusíme se najít čas v mluveném slově
      const detectedTime = extractTimeFromText(transcript);
      
      if (detectedTime) {
        setTaskTime(detectedTime);
        // Odstraníme čas z textu úkolu, aby tam nezavazel (volitelné)
        const cleanTask = transcript.replace(/(\d{1,2}[:.]\d{2}|\d{1,2}\s\d{2}|ve?\s\d{1,2})/i, "").trim();
        setTask(cleanTask);
      } else {
        setTask(transcript);
        // Pokud čas nebyl detekován, nastavíme aktuální čas automaticky
        const now = new Date();
        setTaskTime(now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
      }
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
      // Převedeme texty na objekty s ID a stavem completed
      subtasks: tempSubtasks.map(t => ({
        id: Math.random().toString(36).substr(2, 9),
        text: t,
        completed: false
      }))
    });

    // Vyčistíme pole, aby se podúkoly necpaly do dalšího nového úkolu
    setTask("");
    setTaskTime("");
    setTempSubtasks([]); 
  } catch (err) {
    console.error("Chyba při ukládání:", err);
  }
};

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
  };

 return (
  <main className="min-h-screen bg-[#fafafa] p-4 text-[#202020] font-sans">
    {!user ? (
      /* ... tvůj stávající kód pro přihlášení ... */
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h1 className="text-4xl font-black mb-6 text-[#db4c3f]">KanbanPro ⚡</h1>
        <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-[#202020] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition">
          Přihlásit se přes Google
        </button>
      </div>
    ) : (
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold">Dnešní přehled</h1>
              <p className="text-sm text-gray-500">{tasks.length} úkolů k vyřízení</p>
            </div>
            <button onClick={() => signOut(auth)} className="text-xs font-bold text-gray-400 hover:text-red-500 transition">Odhlásit se</button>
          </div>
          
          {/* Formulář pro přidání úkolu ve stylu Todoist */}
          <form onSubmit={handleAddTask} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <input 
                value={task} 
                onChange={e => setTask(e.target.value)} 
                placeholder="Název úkolu..." 
                className="w-full p-2 pr-20 outline-none text-gray-800 placeholder:text-gray-400 font-medium" 
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button type="button" onClick={startListening} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Diktovat">🎙️</button>
                <button type="button" onClick={improveWithAI} className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-500" title="Vylepšit pomocí AI">✨</button>
              </div>
            </div>
            <div className="flex gap-2 items-center border-l pl-2">
              <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="text-xs font-bold text-gray-500 bg-transparent outline-none cursor-pointer hover:text-red-500" />
              <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} className="text-xs font-bold text-gray-500 bg-transparent outline-none cursor-pointer hover:text-red-500" />
            </div>
            <button type="submit" className="bg-[#db4c3f] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#b03d32] transition">Přidat</button>
          </form>
        </header>

        {/* KANBAN TABULE */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col md:flex-row gap-6">
            {COLUMNS.map(col => (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 min-h-[500px]">
                    <h2 className="text-xs font-bold text-gray-500 mb-4 px-2 tracking-widest uppercase flex justify-between">
                      {col.title}
                      <span className="bg-gray-200 text-gray-600 px-2 rounded-full text-[10px]">{tasks.filter(t => t.status === col.id).length}</span>
                    </h2>
                    
                    <div className="space-y-3">
                      {tasks.filter(t => t.status === col.id).map((t, index) => (
                        <Draggable key={t.id} draggableId={t.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps} 
                              className="group flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-200 transition-all relative"
                            >
                              {/* Kroužek pro smazání/splnění */}
                              <div 
                                onClick={() => deleteTask(t.id)}
                                className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-red-500 opacity-0 group-hover:opacity-20 hover:!opacity-100 transition-opacity"></div>
                              </div>
                              <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-100">
  {/* Výpis stávajících podúkolů */}
  {t.subtasks?.map(st => (
    <div key={st.id} className="flex items-center gap-2 group/sub">
      <input 
        type="checkbox" 
        checked={st.completed} 
        onChange={() => toggleSubTask(t.id, st.id)}
        className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
      />
      <span className={`text-xs ${st.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
        {st.text}
      </span>
    </div>
  ))}

  {/* Mini formulář pro rychlé přidání podúkolu */}
  {/* Náhled podúkolů před uložením */}
{tempSubtasks.length > 0 && (
  <div className="w-full px-2 py-1 space-y-1">
    <p className="text-[10px] font-bold text-purple-500 uppercase">AI navrhuje kroky:</p>
    {tempSubtasks.map((st, i) => (
      <div key={i} className="text-xs text-gray-500 flex items-center gap-2">
        <span className="w-1 h-1 bg-purple-300 rounded-full"></span> {st}
      </div>
    ))}
  </div>
)}
  <input 
    type="text"
    placeholder="+ Přidat podúkol"
    className="text-[11px] text-gray-400 bg-transparent outline-none hover:text-gray-600 focus:text-gray-800 w-full"
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubTask(t.id, e.currentTarget.value);
        e.currentTarget.value = "";
      }
    }}
  />
</div>
                              <div className="flex-1">
                                <p className={`font-medium leading-tight ${t.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                  {t.text}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`text-[11px] font-bold flex items-center gap-1 ${t.status === 'done' ? 'text-gray-300' : 'text-red-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'done' ? 'bg-gray-300' : 'bg-red-500'}`}></span>
                                    {t.date === new Date().toISOString().split('T')[0] ? 'Dnes' : t.date} {t.time}
                                  </span>
                                </div>
                              </div>
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