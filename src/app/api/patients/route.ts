/**
 * POST /api/patients
 *
 * Creates a new patient or returns an existing one by name.
 * This endpoint is idempotent — calling it twice with the same
 * name will return the same patient record.
 *
 * @body {PatientCreateRequest} - { full_name: string }
 * @returns {PatientCreateResponse} - { patient: Patient }
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PatientCreateRequest, PatientCreateResponse, ApiError } from '@/lib/types';

export async function POST(
  request: Request
): Promise<NextResponse<PatientCreateResponse | ApiError>> {
  try {
    const body: PatientCreateRequest = await request.json();

    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: 'Missing required field: full_name' }, { status: 400 });
    }

    const sanitizedName = body.full_name.trim();

    // Idempotent: return existing patient if found
    const { data: existing } = await supabase
      .from('patients')
      .select('*')
      .eq('full_name', sanitizedName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ patient: existing });
    }

    // Create new patient
    const { data: patient, error } = await supabase
      .from('patients')
      .insert({ full_name: sanitizedName })
      .select()
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);

    return NextResponse.json({ patient }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/patients]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
