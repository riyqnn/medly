-- 7. Admin Table for Multi-Tenant
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'admin', -- admin, super_admin
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uniq_admin_username_per_hospital UNIQUE(hospital_id, username)
);
