"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PatientNav({
  admissionId,
  showSpiritual,
}: {
  admissionId: string;
  showSpiritual: boolean;
}) {
  const pathname = usePathname();
  const base = `/patient/${admissionId}`;

  const items = [
    { href: base, label: "Home" },
    { href: `${base}/medical-info`, label: "Info Medis & Jadwal" },
    { href: `${base}/nurse-call`, label: "Panggil Perawat" },
    { href: `${base}/meals`, label: "Pesan Makanan" },
    { href: `${base}/education`, label: "Edukasi" },
    { href: `${base}/entertainment`, label: "Hiburan" },
    { href: `${base}/recovery`, label: "Progres Pemulihan" },
    ...(showSpiritual ? [{ href: `${base}/spiritual`, label: "Kerohanian" }] : []),
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="max-w-5xl mx-auto px-6 flex gap-1">
        {items.map((item) => {
          const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
