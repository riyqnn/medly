-- ==============================================================================
-- MEDLY HIS (Hospital Information System) - Database Schema
-- Architecture: Multi-Tenant per Hospital (PostgreSQL)
-- ==============================================================================

-- ==========================================
-- DROP EXISTING TABLES (Reset Database)
-- ==========================================
DROP TABLE IF EXISTS spiritual_contents CASCADE;
DROP TABLE IF EXISTS recovery_checklist_items CASCADE;
DROP TABLE IF EXISTS recovery_progress CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS vital_signs CASCADE;
DROP TABLE IF EXISTS patient_nurse_assignments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS patient_activity_logs CASCADE;
DROP TABLE IF EXISTS entertainment_contents CASCADE;
DROP TABLE IF EXISTS education_contents CASCADE;
DROP TABLE IF EXISTS education_categories CASCADE;
DROP TABLE IF EXISTS meal_orders CASCADE;
DROP TABLE IF EXISTS meal_menus CASCADE;
DROP TABLE IF EXISTS meal_categories CASCADE;
DROP TABLE IF EXISTS treatment_schedules CASCADE;
DROP TABLE IF EXISTS nurse_requests CASCADE;
DROP TABLE IF EXISTS nurse_shifts CASCADE;
DROP TABLE IF EXISTS nurses CASCADE;
DROP TABLE IF EXISTS patient_doctor_assignments CASCADE;
DROP TABLE IF EXISTS doctor_schedules CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patient_admissions CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- ==========================================
-- 0. ROOT ENTITY (HOSPITALS)
-- ==========================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR UNIQUE, -- Made nullable for register flow
    name VARCHAR NOT NULL,
    address TEXT,
    spiritual_support_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 0b. AUTH PROFILES (login identity + RBAC)
-- Defined before the staff tables because doctors/nurses point back at it.
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL for platform ADMIN
    role VARCHAR NOT NULL DEFAULT 'HOSPITAL', -- ADMIN, HOSPITAL, DOCTOR, NURSE
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 1. PATIENT MANAGEMENT
-- ==========================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    room_number VARCHAR NOT NULL,
    ward_name VARCHAR,
    capacity INT DEFAULT 1,
    status VARCHAR DEFAULT 'AVAILABLE', -- AVAILABLE, FULL, MAINTENANCE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, room_number)
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    mrn VARCHAR NOT NULL, -- Medical Record Number
    full_name VARCHAR NOT NULL,
    dob DATE,
    gender VARCHAR,
    contact_number VARCHAR,
    emergency_contact VARCHAR,
    address TEXT,
    -- Facts a clinician needs before touching the patient.
    blood_type VARCHAR CHECK (blood_type IN ('A','B','AB','O','A+','A-','B+','B-','AB+','AB-','O+','O-')),
    allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, mrn)
);

CREATE TABLE patient_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    admission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'ACTIVE', -- ACTIVE, DISCHARGED, TRANSFERRED, DECEASED
    -- Clinical context of this stay.
    primary_diagnosis VARCHAR,
    secondary_diagnosis TEXT,
    chief_complaint TEXT,
    care_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. DOCTOR MANAGEMENT
-- ==========================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    -- The login this record belongs to. NULL = a doctor the hospital tracks but
    -- who does not sign in to Medly. Never match staff to accounts by name.
    profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    employee_code VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    specialization VARCHAR,
    str_number VARCHAR,
    sip_number VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, employee_code)
);

CREATE TABLE doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INT, -- 0 (Sun) to 6 (Sat) for recurring, NULL for specific dates
    specific_date DATE, -- NULL for recurring
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR, -- e.g., Poli Umum, Room 101
    status VARCHAR DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE patient_doctor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'MAIN_DOCTOR', -- MAIN_DOCTOR, CONSULTING_DOCTOR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, admission_id, doctor_id)
);

-- ==========================================
-- 3. NURSE MANAGEMENT
-- ==========================================
CREATE TABLE nurses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    employee_code VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, employee_code)
);

-- Who is responsible for this patient. Nurse requests deliberately do NOT route
-- by this: a call goes to the whole ward queue so it is never trapped behind
-- one nurse's shift. This is accountability, not dispatch.
CREATE TABLE patient_nurse_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'PRIMARY_NURSE' CHECK (role IN ('PRIMARY_NURSE','ASSOCIATE_NURSE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, admission_id, nurse_id)
);

CREATE TABLE nurse_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
    ward_name VARCHAR,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE nurse_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    request_category VARCHAR NOT NULL CHECK (request_category IN ('CALL_NURSE','PAIN','IV_DRIP','BATHROOM','DRINKING_WATER','EXTRA_BLANKET','OTHER')),
    priority VARCHAR DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
    status VARCHAR DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED
    handled_by_nurse_id UUID REFERENCES nurses(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 4. TREATMENT SCHEDULE
-- ==========================================
CREATE TABLE treatment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    category VARCHAR NOT NULL CHECK (category IN ('DOCTOR_VISIT','MEDICATION','LAB','RADIOLOGY','PHYSIO','CONTROL')),
    title VARCHAR NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR DEFAULT 'SCHEDULED', -- SCHEDULED, DONE, CANCELLED, RESCHEDULED
    related_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 4b. MEDICAL INFORMATION (VITAL SIGNS)
-- ==========================================
CREATE TABLE vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    temperature_celsius NUMERIC(4,1),
    respiratory_rate INT,
    oxygen_saturation INT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);
CREATE INDEX idx_vitals_admission ON vital_signs(admission_id, measured_at DESC);

-- ==========================================
-- 4b-2. MEDICAL RECORD NOTES
-- Medly does not replace the hospital's EMR (see MVP scope); this is the
-- working clinical record the lightweight HIS keeps per admission.
-- ==========================================
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    record_type VARCHAR NOT NULL CHECK (record_type IN ('ANAMNESIS','EXAMINATION','DIAGNOSIS','PROGRESS','ACTION','OTHER')),
    title VARCHAR NOT NULL,
    content TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Kept alongside the FK so a note still says who wrote it after an account
    -- is removed.
    author_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_medrec_admission ON medical_records(admission_id, recorded_at DESC);

-- ==========================================
-- 4c. RECOVERY PROGRESS
-- ==========================================
CREATE TABLE recovery_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL UNIQUE REFERENCES patient_admissions(id) ON DELETE CASCADE,
    estimated_total_days INT,
    current_day INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE recovery_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    recovery_progress_id UUID NOT NULL REFERENCES recovery_progress(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    target_date DATE,
    is_done BOOLEAN DEFAULT false,
    done_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_recovery_checklist_progress ON recovery_checklist_items(recovery_progress_id);

-- ==========================================
-- 5. MEAL MANAGEMENT
-- ==========================================
CREATE TABLE meal_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, name)
);

CREATE TABLE meal_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    category_id UUID REFERENCES meal_categories(id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    image_url VARCHAR,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    meal_type_tags JSONB, -- e.g. ["BREAKFAST", "LUNCH", "DINNER"]
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE meal_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES meal_menus(id) ON DELETE RESTRICT,
    meal_schedule VARCHAR NOT NULL, -- BREAKFAST, LUNCH, DINNER
    order_date DATE NOT NULL,
    status VARCHAR DEFAULT 'PENDING', -- PENDING, PREPARING, DELIVERED, REJECTED
    patient_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 6. EDUCATION MANAGEMENT
-- ==========================================
CREATE TABLE education_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULLABLE FOR GLOBAL CONTENT
    name VARCHAR NOT NULL,
    icon_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE education_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULLABLE FOR GLOBAL CONTENT
    category_id UUID REFERENCES education_categories(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL CHECK (content_type IN ('ARTICLE','VIDEO','PDF','INFOGRAPHIC')),
    media_url VARCHAR,
    body_text TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 7. ENTERTAINMENT MANAGEMENT
-- ==========================================
CREATE TABLE entertainment_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULLABLE FOR GLOBAL CONTENT
    category VARCHAR NOT NULL CHECK (category IN ('MOVIE','TV','MUSIC','PODCAST','EBOOK','MAGAZINE','GAME_LINK','RELAXATION_VIDEO','BANNER')),
    title VARCHAR NOT NULL,
    thumbnail_url VARCHAR,
    media_url VARCHAR,
    display_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 7b. SPIRITUAL SUPPORT (OPTIONAL, per-hospital toggle via hospitals.spiritual_support_enabled)
-- ==========================================
CREATE TABLE spiritual_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULLABLE FOR GLOBAL CONTENT
    category VARCHAR NOT NULL CHECK (category IN ('PRAYER_TIME','MUROTTAL','DAILY_PRAYER','REFLECTION','OTHER')),
    title VARCHAR NOT NULL,
    media_url VARCHAR,
    body_text TEXT,
    display_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 8. PATIENT ACTIVITY LOGS (DASHBOARD METRICS)
-- ==========================================
CREATE TABLE patient_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    event_name VARCHAR NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- No updated_at for append-only logs
    created_by UUID
);

-- ==========================================
-- INDEXES FOR PERFORMANCE & DASHBOARD QUERIES
-- ==========================================
CREATE INDEX idx_admissions_hospital_status ON patient_admissions(hospital_id, status);
CREATE INDEX idx_nurse_req_hospital_status ON nurse_requests(hospital_id, status);
CREATE INDEX idx_meal_orders_hospital_status_date ON meal_orders(hospital_id, status, order_date);
CREATE INDEX idx_treatment_sched_hospital_status ON treatment_schedules(hospital_id, status);

-- profiles is defined in section 0b, before the staff tables that reference it.

-- ==========================================
-- 9. STAFF IDENTITY INDEXES
-- ==========================================
CREATE INDEX idx_doctors_profile ON doctors(profile_id);
CREATE INDEX idx_nurses_profile ON nurses(profile_id);
CREATE INDEX idx_nurse_assign_admission ON patient_nurse_assignments(admission_id);
