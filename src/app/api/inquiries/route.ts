/**
 * GET /api/inquiries
 *
 * Fetches all triaged inquiries for the Doctor Dashboard.
 * Joins triages → inquiries → patients for a complete view.
 * Results are ordered newest-first.
 *
 * @returns {InquiriesResponse} - { triages: Triage[] }
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { InquiriesResponse, ApiError } from '@/lib/types';

export const dynamic = 'force-dynamic'; // Never cache — always fetch fresh data

export async function GET(): Promise<NextResponse<InquiriesResponse | ApiError>> {
  try {
    const { data: triages, error } = await supabase
      .from('triages')
      .select(`
        *,
        inquiry:inquiries (
          id,
          raw_text,
          status,
          patient:patients (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    return NextResponse.json({ triages: triages || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/inquiries]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
