import { notFound } from "next/navigation";
import { getBedsideSession } from "@/src/features/patient/utils/session";
import PatientNav from "./PatientNav";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  const session = await getBedsideSession(admissionId);
  if (!session) notFound();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <p className="text-xs text-gray-500">{session.hospital?.name}</p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {session.patient?.full_name}
            </h1>
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-500">
              Kamar <span className="font-semibold text-gray-900 dark:text-white">{session.room?.room_number || "-"}</span>
            </p>
            <p className="text-gray-500">Hari rawat ke-{session.day_of_stay}</p>
          </div>
        </div>
      </header>

      <PatientNav
        admissionId={session.admission_id}
        showSpiritual={!!session.hospital?.spiritual_support_enabled}
      />

      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
