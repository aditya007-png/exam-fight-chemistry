-- ==============================================================================
-- EXAM FIGHT CHEMISTRY - SEED DATA SCRIPT
-- ==============================================================================

-- 1. Insert Initial Teacher Verification Codes (Active)
INSERT INTO public.teacher_verification_codes (code, is_used, expires_at)
VALUES 
    ('CHEM-TEACHER-2026-ALPHA', FALSE, NOW() + INTERVAL '30 days'),
    ('CHEM-TEACHER-2026-BETA', FALSE, NOW() + INTERVAL '30 days'),
    ('CHEM-TEACHER-2026-GAMMA', FALSE, NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;

-- 2. How to create an initial Admin user:
-- Step 1: Sign up through the application with your admin email (e.g. admin@examfight.chem)
-- Step 2: Run the following SQL statement in the Supabase SQL editor:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@examfight.chem';
