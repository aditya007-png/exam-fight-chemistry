# EXAM FIGHT CHEMISTRY — ARCHITECTURE AUDIT & REBUILD BLUEPRINT
**Phase 0: Comprehensive System Audit**

## 1. TECHNOLOGY STACK
- Frontend: React 18.3.1 + TypeScript 5.7.3 + Vite 6.1.0 + Tailwind CSS 3.4.17
- Backend: Supabase REST & Realtime PostgreSQL Engine
- Database: PostgreSQL 15+ with relational schema, Foreign Keys, Triggers, RLS
- Authentication: Supabase GoTrue Auth (auth.users -> public.profiles)
- Storage / Vault: Supabase Storage & Evidence Vault (public.exam_evidence)
- Telemetry & Vision: Client-Side Vision Engine (visionEngine.ts) for 300° room scan and gaze tracking

## 2. DATABASE SCHEMA ENTITIES
- public.profiles (id, email, full_name, role)
- public.classes (id, name, code, teacher_id, academic_year)
- public.sections (id, class_id, name, enrollment_code)
- public.class_members (id, class_id, section_id, student_id, joined_at)
- public.teacher_verification_codes (id, code, is_used, expires_at)
- public.exams (id, title, teacher_id, class_id, section_id, duration_minutes, questions, status)
- public.exam_attempts (id, exam_id, student_id, section_id, status, score, answers, proctoring_events)
- public.exam_evidence (id, exam_id, attempt_id, student_id, evidence_type, file_path, metadata)

## 3. AUDIT OF CURRENT PROBLEMS
1. Dual Storage vs Database: Hybrid localStorage fallbacks causing cross-tab/incognito isolation when .env is omitted in local dev.
2. Central Backend Connection: Database operations require unified connection configuration.
3. Roster & Name Mapping: Real teacher and student profile names must be queried dynamically via foreign keys.

## 4. REUSABLE ASSETS
- Chemistry Tools: PeriodicTableModal, ChemistryCalculator, MoleculeViewer3D
- Proctoring & Scan: RoomScanExperience (300° trajectory), ProctoringCornerWidget, visionEngine
- Exam Engine: ExamPlayerPage, QuestionPalette, QuestionCard
- Review Portal: ProctoringReviewPage, StudentAttemptEvidencePage

## 5. REBUILD SEQUENCE
1. Database Foundation & Clean Schema
2. Real Unified Authentication & Profiles
3. Role Gateways (Admin, Teacher, Student)
4. Class & Section Creation
5. Student Enrollment via Real Database Keys
6. Exam Creation & Section Assignments
7. Pre-Exam Verification & 300° Room Scan
8. Secure Exam Interface & Real-Time Answer Autosave
9. Proctoring Telemetry & Violation Logging
10. Scoring & Results Calculation
11. Evidence Vault & Teacher Audit Review
12. Security & RLS Enforcement
13. Production Build Verification
