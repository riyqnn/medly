

-- ==========================================
-- 0. ROOT ENTITY (HOSPITALS)
-- ==========================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR UNIQUE, -- Made nullable for register flow
    name VARCHAR NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
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
    employee_code VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hospital_id, employee_code)
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
    request_category VARCHAR NOT NULL, -- PAIN, BATHROOM, IV_DRIP, OTHER
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
    category VARCHAR NOT NULL, -- DOCTOR_VISIT, MEDICATION, LAB, PHYSIO
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
    content_type VARCHAR NOT NULL, -- ARTICLE, VIDEO, PDF
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
    category VARCHAR NOT NULL, -- MOVIE, PODCAST, GAME_LINK, BANNER
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

-- ==========================================
-- 9. AUTH PROFILES (For Login/RBAC)
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL DEFAULT 'HOSPITAL', -- HOSPITAL, DOCTOR, NURSE, ADMIN
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
