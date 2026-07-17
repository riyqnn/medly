import { StaffManager } from "@/src/features/staff/components/StaffManager";

export default function NursesPage() {
  return (
    <StaffManager
      role="NURSE"
      endpoint="/api/nurses"
      title="Nurses"
      description="Nurses with a login receive patient requests in their portal."
      addLabel="Add nurse"
    />
  );
}
