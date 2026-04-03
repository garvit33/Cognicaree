/**
 * POST /api/approve
 *
 * Allows a doctor to approve (and optionally edit) an AI-drafted response.
 * Updates the triage record and marks the linked inquiry as 'completed'.
 *
 * This is the human-in-the-loop step — AI never contacts patients directly.
 *
 * @body {ApproveRequest} - { triageId: string, updatedDraft?: string }
 * @returns {ApproveResponse} - { success, triage }
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ApproveRequest, ApproveResponse, ApiError } from '@/lib/types';

export async function POST(
  request: Request
): Promise<NextResponse<ApproveResponse | ApiError>> {
  try {
    const body: ApproveRequest = await request.json();

    if (!body.triageId) {
      return NextResponse.json({ error: 'Missing required field: triageId' }, { status: 400 });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      doctor_approved: true,
    };

    if (body.updatedDraft?.trim()) {
      updatePayload.ai_draft_response = body.updatedDraft.trim();
    }

    // Update triage
    const { data: triage, error: triageError } = await supabase
      .from('triages')
      .update(updatePayload)
      .eq('id', body.triageId)
      .select()
      .single();

    if (triageError) {
      throw new Error(`Triage update error: ${triageError.message}`);
    }

    // Mark inquiry as completed
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update({ status: 'completed' })
      .eq('id', triage.inquiry_id);

    if (inquiryError) {
      throw new Error(`Inquiry update error: ${inquiryError.message}`);
    }

    console.log(`[POST /api/approve] Triage ${body.triageId} approved by doctor`);

    return NextResponse.json({ success: true, triage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/approve] ERROR:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
