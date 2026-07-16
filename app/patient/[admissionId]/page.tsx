import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Stethoscope,
  Bell,
  UtensilsCrossed,
  BookOpen,
  Clapperboard,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { getBedsideSession } from "@/src/features/patient/utils/session";

export default async function PatientHomePage({
  params,
}: {
  params: Promise<{ admissionId: string }>;
}) {
  const { admissionId } = await params;
  const session = await getBedsideSession(admissionId);
  if (!session) notFound();

  const base = `/patient/${session.admission_id}`;
  const mainDoctor = session.doctors.find((d) => d.role === "MAIN_DOCTOR") || session.doctors[0];

  const tiles = [
    { href: `${base}/medical-info`, icon: Stethoscope, label: "Info Medis & Jadwal", desc: "Dokter, diagnosa, jadwal perawatan" },
    { href: `${base}/nurse-call`, icon: Bell, label: "Panggil Perawat", desc: "Butuh bantuan? Hubungi perawat" },
    { href: `${base}/meals`, icon: UtensilsCrossed, label: "Pesan Makanan", desc: "Lihat menu & status pesanan" },
    { href: `${base}/education`, icon: BookOpen, label: "Edukasi Kesehatan", desc: "Artikel, video, infografik" },
    { href: `${base}/entertainment`, icon: Clapperboard, label: "Hiburan", desc: "Film, musik, podcast, buku" },
    { href: `${base}/recovery`, icon: HeartPulse, label: "Progres Pemulihan", desc: "Pantau perkembangan pemulihan" },
    ...(session.hospital?.spiritual_support_enabled
      ? [{ href: `${base}/spiritual`, icon: Sparkles, label: "Kerohanian", desc: "Jadwal sholat, murottal, doa" }]
      : []),
  ];

  return (
    <div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
        <p className="text-sm text-gray-500">Selamat datang,</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{session.patient?.full_name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm">
          <div>
            <p className="text-xs text-gray-500">Dokter Penanggung Jawab</p>
            <p className="font-medium">{mainDoctor?.full_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Diagnosa Utama</p>
            <p className="font-medium">{session.primary_diagnosis || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Kamar</p>
            <p className="font-medium">{session.room?.room_number || "-"} — {session.room?.ward_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Hari Rawat</p>
            <p className="font-medium">Hari ke-{session.day_of_stay}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <tile.icon className="w-7 h-7 text-blue-600 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-white">{tile.label}</p>
            <p className="text-xs text-gray-500 mt-1">{tile.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
