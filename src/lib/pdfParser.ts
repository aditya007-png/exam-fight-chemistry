// src/lib/pdfParser.ts — improved chemistry MCQ extractor using pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';
import { ChemQuestion, ChemOption } from '../types/question';
import { convertChemText } from '../components/chemistry/ChemRenderer';

// ── Sub/superscript conversions for raw PDF text ──────────────────────────────

function fixChemNotation(raw: string): string {
  return convertChemText(raw);
}

// ── Extract all text from PDF ────────────────────────────────────────────────

async function getPdfText(buffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  let full = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strs = (content.items as Array<{ str: string }>).map((item) => item.str);
    full += strs.join(' ') + '\n';
  }
  return full;
}

// ── Detect if PDF is image-only (no extractable text) ────────────────────────

function isLikelyScanned(text: string): boolean {
  return text.trim().length < 50;
}

// ── MCQ extraction ────────────────────────────────────────────────────────────
// Supports question numbering: 1. / Q1. / Q1) / (1) / 1)
// Supports option labels:       A. / A) / (a) / a.  (case insensitive)
// Supports answer keys:         Correct Answer: B / Answer: B / Ans: B / Ans.(B)

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface RawMcq {
  stem: string;
  options: Record<string, string>; // A/B/C/D → text
  answer?: string;
}

function extractRawMcqs(text: string): RawMcq[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: RawMcq[] = [];

  let currentQ: RawMcq | null = null;

  // Option line detection: A. / A) / (a) / a. (at line start)
  const optionLine = (line: string): { label: string; text: string } | null => {
    const m = line.match(/^(?:\(([A-Da-d])\)|([A-Da-d])[.)]\s+)(.+)/);
    if (!m) return null;
    const label = (m[1] || m[2]).toUpperCase();
    const text = m[3].trim();
    return { label, text };
  };

  // Answer key line detection
  const answerLine = (line: string): string | null => {
    const m = line.match(/(?:correct\s+answer|answer|ans)[.:)]\s*\(?([A-Da-d])\)?/i);
    return m ? m[1].toUpperCase() : null;
  };

  // Question number detection (at line start)
  const questionNumLine = (line: string): string | null => {
    const m = line.match(/^(?:Q\.?\s*)?(\d+)[.)]\s+(.+)/i);
    return m ? m[2].trim() : null;
  };

  for (const line of lines) {
    // Check for answer key first
    const ans = answerLine(line);
    if (ans && currentQ) {
      currentQ.answer = ans;
      continue;
    }

    // Check for option line
    const opt = optionLine(line);
    if (opt && currentQ) {
      currentQ.options[opt.label] = opt.text;
      continue;
    }

    // Check for question number
    const qText = questionNumLine(line);
    if (qText) {
      if (currentQ && Object.keys(currentQ.options).length >= 2) {
        results.push(currentQ);
      }
      currentQ = { stem: qText, options: {} };
      continue;
    }

    // Continuation of question stem (before any options appear)
    if (currentQ && Object.keys(currentQ.options).length === 0 && line.length > 3) {
      currentQ.stem += ' ' + line;
    }
  }

  // Push last question
  if (currentQ && Object.keys(currentQ.options).length >= 2) {
    results.push(currentQ);
  }

  return results;
}

// ── Validate extracted MCQ ────────────────────────────────────────────────────

function validateMcq(raw: RawMcq): { ok: boolean; reason?: string } {
  if (!raw.stem || raw.stem.length < 5) return { ok: false, reason: 'Question stem too short or missing.' };
  const presentLabels = Object.keys(raw.options);
  if (presentLabels.length < 2) return { ok: false, reason: 'Fewer than 2 options detected.' };
  if (!raw.answer) return { ok: false, reason: 'Correct answer not detected in PDF.' };
  if (!presentLabels.includes(raw.answer)) return { ok: false, reason: `Marked answer "${raw.answer}" does not match any detected option.` };
  return { ok: true };
}

// ── Build ChemQuestion from RawMcq ───────────────────────────────────────────

function buildChemQuestion(raw: RawMcq, index: number): ChemQuestion {
  const validation = validateMcq(raw);
  const options: ChemOption[] = OPTION_LABELS.map((label) => ({
    label: label as ChemOption['label'],
    text: fixChemNotation(raw.options[label] || `Option ${label}`),
  }));

  return {
    id: `pdf-${Date.now()}-${index}`,
    source: 'pdf',
    questionText: fixChemNotation(raw.stem),
    options,
    correctAnswer: raw.answer || 'A',
    topic: 'General Chemistry',
    difficulty: 'Medium',
    marks: 4,
    needsReview: !validation.ok,
    reviewReason: validation.ok ? undefined : validation.reason,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface PdfExtractResult {
  questions: ChemQuestion[];
  isScanned: boolean;
  totalPages: number;
}

export async function extractMcqsFromPdf(buffer: ArrayBuffer): Promise<PdfExtractResult> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const text = await getPdfText(buffer);

  if (isLikelyScanned(text)) {
    return { questions: [], isScanned: true, totalPages: pdf.numPages };
  }

  const rawMcqs = extractRawMcqs(text);
  const questions = rawMcqs.map((raw, idx) => buildChemQuestion(raw, idx));

  return { questions, isScanned: false, totalPages: pdf.numPages };
}
