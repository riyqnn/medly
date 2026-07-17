import { StaffManager } from "@/src/features/staff/components/StaffManager";

export default function DoctorsPage() {
  return (
    <StaffManager
      role="DOCTOR"
      endpoint="/api/doctors"
      title="Doctors"
      description="Add a doctor so they can be assigned to patients and scheduled."
      addLabel="Add doctor"
    />
  );
}
