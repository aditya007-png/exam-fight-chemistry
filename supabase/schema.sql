-- ==============================================================================
-- EXAM FIGHT CHEMISTRY - PRODUCTION SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing triggers and functions if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_teacher();

-- ==============================================================================
-- 3. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. CLASSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'Chemistry',
    academic_year TEXT NOT NULL DEFAULT '2026-27',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. SECTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    enrollment_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. CLASS MEMBERS / SECTION ENROLLMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_class_student UNIQUE (class_id, student_id)
);

-- ==============================================================================
-- 7. TEACHER VERIFICATION CODES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teacher_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. EXAMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    total_marks INTEGER NOT NULL DEFAULT 100 CHECK (total_marks > 0),
    passing_marks INTEGER NOT NULL DEFAULT 40 CHECK (passing_marks >= 0),
    questions JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'archived')),
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. EXAM ATTEMPTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'room_scan_pending' CHECK (status IN ('not_started', 'room_scan_pending', 'room_scan_completed', 'in_progress', 'submitted', 'flagged')),
    room_scan_completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    score NUMERIC(5,2),
    total_marks INT DEFAULT 100,
    integrity_score INT DEFAULT 100,
    answers JSONB DEFAULT '{}'::jsonb,
    proctoring_events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. EXAM EVIDENCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('room_scan', 'screenshot', 'proctoring_event', 'webcam_snapshot', 'audio_clip', 'full_session_evidence')),
    file_path TEXT NOT NULL DEFAULT '',
    file_size BIGINT DEFAULT 0,
    duration_seconds NUMERIC(6,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON public.sections(class_id);
CREATE INDEX IF NOT EXISTS idx_sections_code ON public.sections(enrollment_code);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_section ON public.class_members(section_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON public.exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON public.exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_section ON public.exams(section_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_evidence_attempt ON public.exam_evidence(attempt_id);

-- ==============================================================================
-- 11. HELPER SECURITY FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'teacher'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 12. AUTH TRIGGER FOR PROFILE CREATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    user_name TEXT;
BEGIN
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
    
    IF assigned_role NOT IN ('student', 'teacher') THEN
        assigned_role := 'student';
    END IF;

    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

    INSERT INTO public.profiles (id, email, full_name, role, avatar_url, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        user_name,
        assigned_role,
        new.raw_user_meta_data->>'avatar_url',
        now(),
        now()
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_classes_timestamp BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_sections_timestamp BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_exams_timestamp BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
CREATE TRIGGER update_attempts_timestamp BEFORE UPDATE ON public.exam_attempts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_evidence ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Teachers can view students in their classes"
    ON public.profiles FOR SELECT
    USING (
        public.is_teacher() AND EXISTS (
            SELECT 1 FROM public.classes c
            JOIN public.class_members cm ON c.id = cm.class_id
            WHERE c.teacher_id = auth.uid() AND cm.student_id = profiles.id
        )
    );

CREATE POLICY "Students can view teachers of their classes"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_members cm
            JOIN public.classes c ON cm.class_id = c.id
            WHERE cm.student_id = auth.uid() AND c.teacher_id = profiles.id
        )
    );

CREATE POLICY "Users can update their own non-role profile fields"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND (
            role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
        )
    );

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- CLASSES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Teachers can view own classes"
    ON public.classes FOR SELECT
    USING (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled classes"
    ON public.classes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = classes.id AND class_members.student_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all classes"
    ON public.classes FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Teachers can create classes"
    ON public.classes FOR INSERT
    WITH CHECK (public.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update own classes"
    ON public.classes FOR UPDATE
    USING (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY "Teachers can delete own classes"
    ON public.classes FOR DELETE
    USING (teacher_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- SECTIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Teachers can view sections of their classes"
    ON public.sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = sections.class_id AND classes.teacher_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Students can view sections by code or enrollment"
    ON public.sections FOR SELECT
    USING (TRUE);

CREATE POLICY "Teachers can create sections for own classes"
    ON public.sections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = sections.class_id AND classes.teacher_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Teachers can update sections for own classes"
    ON public.sections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = sections.class_id AND classes.teacher_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Teachers can delete sections for own classes"
    ON public.sections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = sections.class_id AND classes.teacher_id = auth.uid()
        ) OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- CLASS MEMBERS / ENROLLMENT POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Members viewable by class teacher or member student or admin"
    ON public.class_members FOR SELECT
    USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_members.class_id AND classes.teacher_id = auth.uid()) OR
        public.is_admin()
    );

CREATE POLICY "Students can join classes"
    ON public.class_members FOR INSERT
    WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Teachers and students can leave/remove from class"
    ON public.class_members FOR DELETE
    USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_members.class_id AND classes.teacher_id = auth.uid()) OR
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- TEACHER VERIFICATION CODES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage verification codes"
    ON public.teacher_verification_codes FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone can verify unexpired codes"
    ON public.teacher_verification_codes FOR SELECT
    USING (is_used = FALSE);

-- ------------------------------------------------------------------------------
-- EXAMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Teachers can view own exams"
    ON public.exams FOR SELECT
    USING (teacher_id = auth.uid());

CREATE POLICY "Students can view exams for enrolled classes and sections"
    ON public.exams FOR SELECT
    USING (
        status IN ('scheduled', 'active', 'completed') AND (
            (class_id IS NULL AND section_id IS NULL) OR
            EXISTS (
                SELECT 1 FROM public.class_members
                WHERE (class_members.class_id = exams.class_id OR exams.class_id IS NULL)
                AND (class_members.section_id = exams.section_id OR exams.section_id IS NULL)
                AND class_members.student_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can view all exams"
    ON public.exams FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Teachers can create exams"
    ON public.exams FOR INSERT
    WITH CHECK (public.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update own exams"
    ON public.exams FOR UPDATE
    USING (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY "Teachers can delete own exams"
    ON public.exams FOR DELETE
    USING (teacher_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- EXAM ATTEMPTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students can view their own attempts"
    ON public.exam_attempts FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own attempts"
    ON public.exam_attempts FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own attempts"
    ON public.exam_attempts FOR UPDATE
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their exams"
    ON public.exam_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE exams.id = exam_attempts.exam_id
            AND exams.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access to exam attempts"
    ON public.exam_attempts FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- EXAM EVIDENCE POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Students can view their own evidence"
    ON public.exam_evidence FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own evidence"
    ON public.exam_evidence FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view evidence for their exams"
    ON public.exam_evidence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE exams.id = exam_evidence.exam_id
            AND exams.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access to exam evidence"
    ON public.exam_evidence FOR ALL
    USING (public.is_admin());
