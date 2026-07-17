import { StaffManager } from "@/src/features/staff/components/StaffManager";

export default function NursesPage() {
  return (
    <StaffManager
      role="NURSE"
      endpoint="/api/nurses"
      title="Perawat"
      description="Perawat dengan akun login akan menerima permintaan pasien di portalnya."
      addLabel="Tambah perawat"
    />
  );
}
