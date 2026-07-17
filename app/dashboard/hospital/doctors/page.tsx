import { StaffManager } from "@/src/features/staff/components/StaffManager";

export default function DoctorsPage() {
  return (
    <StaffManager
      role="DOCTOR"
      endpoint="/api/doctors"
      title="Dokter"
      description="Tambahkan dokter agar bisa ditugaskan ke pasien dan dijadwalkan."
      addLabel="Tambah dokter"
    />
  );
}
