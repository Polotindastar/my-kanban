import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Inicializace AI s klíčem z .env.local
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Chybí text úkolu" }, { status: 400 });
    }

    // 1. Nastavení modelu - Vynucujeme verzi 'v1' a JSON formát
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" }
    );

    const prompt = `Jsi asistent pro plánování úkolů. 
    Tvým cílem je vzít tento text: "${message}" 
    1. Vylepši jeho název, aby byl stručný.
    2. Rozlož ho na 3 konkrétní podúkoly (subtasks).
    
    Vrať výsledek v JSON formátu:
    {
      "text": "vylepšený název",
      "subtasks": ["podúkol 1", "podúkol 2", "podúkol 3"]
    }`;

    // 2. Generování obsahu
    const result = await model.generateContent(prompt);
    
    // 3. Získání textu (deklarujeme pouze jednou!)
    let cleanText = result.response.text();

    // 4. Vyčištění od případných Markdown značek (```json ... ```)
    cleanText = cleanText// Místo původních dvou řádků použij toto:
const responseText = result.response.text()
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

// Teď už můžeš v klidu parsovat:

    // 5. Parsování a odeslání
    const aiData = JSON.parse(cleanText);
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("Detail chyby na serveru:", error);
    return NextResponse.json(
      { error: "AI momentálně neodpovídá", details: error.message },
      { status: 500 }
    );
  }
}

// Pomocný GET pro testování
export async function GET() {
  return NextResponse.json({ status: "API Route je online!" });
}