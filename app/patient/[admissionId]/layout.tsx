import { notFound } from "next/navigation";
import { getBedsideSession } from "@/src/features/patient/utils/session";
import { BedsideTopBar } from "./PatientShell";

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
    /* Fixed to the viewport: this is a wall-mounted tablet, not a web page.
       Nothing here ever scrolls — each screen fits or pages itself. */
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-brand-50 via-canvas to-canvas">
      <BedsideTopBar
        admissionId={session.admission_id}
        room={session.room?.room_number ?? null}
        ward={session.room?.ward_name ?? null}
        hospital={session.hospital?.name ?? null}
        careTeam={session.doctors}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 sm:px-7 sm:pb-7">
        {children}
      </main>
    </div>
  );
}
