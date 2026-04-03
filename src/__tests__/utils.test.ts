/**
 * Unit tests for CogniCare utility functions and type validation.
 *
 * Tests cover:
 * - Type guard validation for API payloads
 * - Input sanitization logic
 * - Urgency level validation
 */
import type { GeminiTriageOutput, UrgencyLevel } from '@/lib/types';

// ===== Helper functions extracted for testability =====

/** Validates that a string is a valid urgency level */
function isValidUrgency(level: string): level is UrgencyLevel {
  return ['High', 'Medium', 'Routine'].includes(level);
}

/** Sanitizes patient input text */
function sanitizeInput(text: string, maxLength = 2000): string {
  return text.trim().substring(0, maxLength);
}

/** Safely parses Gemini AI JSON response, stripping markdown fences */
function parseGeminiResponse(raw: string): GeminiTriageOutput | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/** Calculates time ago string from a date */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ===== Tests =====

describe('Urgency Level Validation', () => {
  test('accepts valid urgency levels', () => {
    expect(isValidUrgency('High')).toBe(true);
    expect(isValidUrgency('Medium')).toBe(true);
    expect(isValidUrgency('Routine')).toBe(true);
  });

  test('rejects invalid urgency levels', () => {
    expect(isValidUrgency('high')).toBe(false);
    expect(isValidUrgency('Critical')).toBe(false);
    expect(isValidUrgency('')).toBe(false);
    expect(isValidUrgency('URGENT')).toBe(false);
  });
});

describe('Input Sanitization', () => {
  test('trims whitespace from input', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  test('truncates input exceeding max length', () => {
    const longInput = 'a'.repeat(3000);
    expect(sanitizeInput(longInput).length).toBe(2000);
  });

  test('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });

  test('respects custom max length', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello');
  });
});

describe('Gemini Response Parsing', () => {
  test('parses clean JSON correctly', () => {
    const raw = '{"urgency_level": "High", "symptoms": ["fever"], "draft_response": "Rest."}';
    const result = parseGeminiResponse(raw);
    expect(result).not.toBeNull();
    expect(result!.urgency_level).toBe('High');
    expect(result!.symptoms).toEqual(['fever']);
  });

  test('strips markdown fences before parsing', () => {
    const raw = '```json\n{"urgency_level": "Medium", "symptoms": ["cough"], "draft_response": "Drink fluids."}\n```';
    const result = parseGeminiResponse(raw);
    expect(result).not.toBeNull();
    expect(result!.urgency_level).toBe('Medium');
  });

  test('returns null for malformed JSON', () => {
    expect(parseGeminiResponse('not json at all')).toBeNull();
    expect(parseGeminiResponse('{broken: json}')).toBeNull();
  });
});

describe('Time Ago Utility', () => {
  test('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('just now');
  });

  test('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  test('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });

  test('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});
