import { PageShell, PageHeader } from "@/src/features/shell/components/Page";
import { CreateHospitalForm } from "@/src/features/auth/components/CreateHospitalForm";

export default function CreateHospitalPage() {
  return (
    <PageShell>
      <PageHeader 
        title="Create New Hospital" 
        description="Register a hospital in the system along with its first admin account." 
      />

      <div className="mt-6 max-w-xl">
        <div className="card p-6">
          <CreateHospitalForm />
        </div>
      </div>
    </PageShell>
  );
}
