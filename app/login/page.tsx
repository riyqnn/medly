import Link from "next/link";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import { AuthShell } from "@/src/features/auth/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Medly"
      subtitle="Manage your patients, schedules and inpatient services."
      footer={null}
      pitch={{
        heading: "One screen at the bedside, connected to the whole hospital.",
        body: "Medly connects patients to nurses, treatment schedules, meals, education and entertainment — all sourced from the systems you already run.",
        points: [
          "Patient requests land straight with a nurse",
          "HIS schedules appear on the tablet automatically",
          "Meal ordering without waiting for staff",
        ],
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
