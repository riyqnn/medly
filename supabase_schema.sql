-- ==========================================
-- STEP 1: TEARDOWN (Run this first to reset)
-- ==========================================

-- Drop trigger & function
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Drop tables (profiles first due to FK dependency)
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.hospitals CASCADE;

-- Drop enum
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Clear auth users (only do this in development/testing!)
-- WARNING: This deletes ALL users in Supabase Auth
DELETE FROM auth.users;

-- ==========================================
-- STEP 2: SCHEMA CREATION
-- ==========================================

-- 1. Create UserRole Enum
CREATE TYPE public.user_role AS ENUM ('HOSPITAL', 'DOCTOR', 'NURSE');

-- 2. Create Hospitals Table
CREATE TABLE public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    full_name TEXT,
    role public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Hospitals: Users can view their own hospital
CREATE POLICY "Users can view their own hospital" ON public.hospitals
    FOR SELECT USING (
        id IN (SELECT hospital_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

-- Profiles: Users can view profiles in their own hospital
CREATE POLICY "Users can view profiles in their hospital" ON public.profiles
    FOR SELECT USING (
        hospital_id IN (SELECT hospital_id FROM public.profiles WHERE profiles.id = auth.uid())
    );

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

