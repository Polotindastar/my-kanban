import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Chybí API klíč" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Zkusíme nejnovější stabilní název bez prefixů
    // Pokud "gemini-1.5-flash" nefunguje, zkuste "gemini-1.5-flash-8b"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Jsi asistent pro Kanban. Uprav tento úkol: ${message}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("DEBUG INFO:", error);
    
    // Pokud Google vrátí 404, vypíšeme to jasně do odpovědi
    return NextResponse.json({ 
      error: "AI Model nenalezen", 
      details: error.message 
    }, { status: error.status || 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Route funguje, použij POST" });
}