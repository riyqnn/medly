import { PageShell, PageHeader } from "@/src/features/shell/components/Page";
import { CreateHospitalForm } from "@/src/features/auth/components/CreateHospitalForm";

export default function CreateHospitalPage() {
  return (
    <PageShell>
      <PageHeader 
        title="Buat Rumah Sakit Baru" 
        description="Daftarkan rumah sakit ke dalam sistem beserta akun admin pertamanya." 
      />

      <div className="mt-6 max-w-xl">
        <div className="card p-6">
          <CreateHospitalForm />
        </div>
      </div>
    </PageShell>
  );
}
