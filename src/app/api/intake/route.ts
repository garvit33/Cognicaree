/**
 * POST /api/intake
 *
 * Core AI pipeline endpoint. Receives patient text, calls Google Gemini
 * for triage analysis, and stores the structured result in Supabase.
 *
 * Flow: Text → Gemini 1.5 Flash → { urgency, symptoms, draft } → Supabase
 *
 * Google Services Used:
 *   - Google Gemini 1.5 Flash (AI/ML for medical triage)
 *   - Deployed on Google Cloud Run (serverless compute)
 *
 * @body {IntakeRequest} - { patientId: string, text: string }
 * @returns {IntakeResponse} - { success, inquiry, triage }
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  IntakeRequest,
  IntakeResponse,
  GeminiTriageOutput,
  ApiError,
} from '@/lib/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * System prompt for Gemini. Instructs the model to act as a medical
 * triage assistant with strict JSON output constraints.
 */
const TRIAGE_SYSTEM_PROMPT = `You are a medical triage AI assistant for a primary care clinic.
Your role is to analyze patient messages and provide structured triage data.

RULES:
- Classify urgency as exactly one of: "High", "Medium", or "Routine"
- High: symptoms suggesting emergency (chest pain, difficulty breathing, severe bleeding, stroke signs)
- Medium: symptoms needing attention within 24-48 hours (persistent fever, moderate pain, infection signs)
- Routine: general health questions, mild symptoms, follow-ups
- Extract distinct symptoms as short phrases
- Draft a professional, empathetic response that a doctor would send
- If unsure about severity, err on the side of higher urgency
- Always suggest scheduling an appointment for anything beyond a simple question
- NEVER diagnose conditions — only triage and suggest next steps

OUTPUT: Return ONLY a raw JSON object with no markdown, no backticks, no explanation.`;

export async function POST(
  request: Request
): Promise<NextResponse<IntakeResponse | ApiError>> {
  const startTime = performance.now();

  try {
    const body: IntakeRequest = await request.json();

    // ── Validation ──
    if (!body.patientId || !body.text?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId and text' },
        { status: 400 }
      );
    }

    const sanitizedText = body.text.trim().substring(0, 2000); // Cap input length

    // ── 1. Save raw inquiry to Supabase ──
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        patient_id: body.patientId,
        raw_text: sanitizedText,
      })
      .select()
      .single();

    if (inquiryError) {
      throw new Error(`Database insert error: ${inquiryError.message}`);
    }

    // ── 2. Call Google Gemini for AI triage ──
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `${TRIAGE_SYSTEM_PROMPT}

Patient Message: "${sanitizedText}"

Required JSON format:
{
  "urgency_level": "High" | "Medium" | "Routine",
  "symptoms": ["symptom 1", "symptom 2"],
  "draft_response": "A polite, professional draft reply."
}`;

    const result = await model.generateContent(prompt);
    const rawAIResponse = result.response.text();

    // Parse JSON (strip any accidental markdown fences)
    const jsonString = rawAIResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    let triageData: GeminiTriageOutput;
    try {
      triageData = JSON.parse(jsonString);
    } catch {
      throw new Error('AI returned invalid JSON. Raw response: ' + rawAIResponse.substring(0, 200));
    }

    // Validate AI output
    const validLevels = ['High', 'Medium', 'Routine'];
    if (!validLevels.includes(triageData.urgency_level)) {
      triageData.urgency_level = 'Medium'; // Safe fallback
    }

    // ── 3. Save triage result to Supabase ──
    const { data: triage, error: triageError } = await supabase
      .from('triages')
      .insert({
        inquiry_id: inquiry.id,
        urgency_level: triageData.urgency_level,
        symptoms_json: triageData.symptoms || [],
        ai_draft_response: triageData.draft_response || 'Please schedule an appointment for further evaluation.',
      })
      .select()
      .single();

    if (triageError) {
      throw new Error(`Triage save error: ${triageError.message}`);
    }

    // ── 4. Update inquiry status ──
    await supabase
      .from('inquiries')
      .update({ status: 'triaged' })
      .eq('id', inquiry.id);

    const durationMs = Math.round(performance.now() - startTime);
    console.log(`[POST /api/intake] Triaged in ${durationMs}ms | Urgency: ${triageData.urgency_level}`);

    return NextResponse.json({ success: true, inquiry, triage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/intake] ERROR:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
