import { notFound } from "next/navigation";
import { getBedsideSession } from "@/src/features/patient/utils/session";
import { BrandMark } from "@/src/features/shell/components/Brand";
import PatientNav from "./PatientNav";

/** Initials for the care-team stack — the bedside has no photos to show. */
function initials(name: string) {
  return name
    .replace(/^(dr\.?|drg\.?|ns\.?)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

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
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-canvas">
      <header className="mx-auto flex max-w-7xl items-start justify-between gap-6 px-6 pb-2 pt-7 sm:px-8">
        <div>
          <p className="eyebrow">
            Kamar {session.room?.room_number ?? "—"}
            {session.room?.ward_name ? ` · ${session.room.ward_name}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-lg font-extrabold tracking-tight text-ink">Medly</span>
            <span className="hidden text-sm font-medium text-ink-mute sm:inline">
              · {session.hospital?.name}
            </span>
          </div>
        </div>

        {session.doctors.length > 0 && (
          <div className="text-right">
            <p className="eyebrow">Tim perawatan Anda</p>
            <div className="mt-2 flex items-center justify-end -space-x-2">
              {session.doctors.slice(0, 3).map((d) => (
                <span
                  key={d.id}
                  title={`${d.full_name}${d.specialization ? ` — ${d.specialization}` : ""}`}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-brand-100 text-[11px] font-extrabold text-brand-700 shadow-sm transition hover:z-10 hover:-translate-y-0.5"
                >
                  {initials(d.full_name)}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Bottom padding clears the floating nav. */}
      <main className="mx-auto max-w-7xl animate-fade-up px-6 pb-32 pt-4 sm:px-8">{children}</main>

      <PatientNav admissionId={session.admission_id} />
    </div>
  );
}
