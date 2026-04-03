/**
 * CogniCare - Shared TypeScript Type Definitions
 * Centralized types for type-safety across the entire application.
 */

// ===== Database Models (mirrors Supabase schema) =====

export interface Patient {
  id: string;
  full_name: string;
  phone_number: string | null;
  created_at: string;
}

export interface Inquiry {
  id: string;
  patient_id: string;
  raw_text: string;
  has_audio: boolean;
  status: 'pending' | 'triaged' | 'completed';
  created_at: string;
  patient?: Patient;
}

export type UrgencyLevel = 'High' | 'Medium' | 'Routine';

export interface Triage {
  id: string;
  inquiry_id: string;
  urgency_level: UrgencyLevel;
  symptoms_json: string[];
  ai_draft_response: string;
  doctor_approved: boolean;
  created_at: string;
  inquiry?: Inquiry;
}

// ===== API Request / Response Types =====

export interface PatientCreateRequest {
  full_name: string;
}

export interface PatientCreateResponse {
  patient: Patient;
}

export interface IntakeRequest {
  patientId: string;
  text: string;
}

export interface IntakeResponse {
  success: boolean;
  inquiry: Inquiry;
  triage: Triage;
}

export interface InquiriesResponse {
  triages: Triage[];
}

export interface ApproveRequest {
  triageId: string;
  updatedDraft?: string;
}

export interface ApproveResponse {
  success: boolean;
  triage: Triage;
}

// ===== Gemini AI Structured Output =====

export interface GeminiTriageOutput {
  urgency_level: UrgencyLevel;
  symptoms: string[];
  draft_response: string;
}

// ===== API Error =====

export interface ApiError {
  error: string;
}
