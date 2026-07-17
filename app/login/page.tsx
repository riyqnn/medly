import Link from "next/link";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import { AuthShell } from "@/src/features/auth/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Masuk ke Medly"
      subtitle="Kelola pasien, jadwal, dan layanan rawat inap Anda."
      footer={null}
      pitch={{
        heading: "Satu layar di sisi tempat tidur, terhubung ke seluruh rumah sakit.",
        body: "Medly menghubungkan pasien dengan perawat, jadwal perawatan, makanan, edukasi, dan hiburan — semuanya bersumber dari sistem yang Anda kelola.",
        points: [
          "Permintaan pasien langsung masuk ke perawat",
          "Jadwal dari HIS tampil otomatis di tablet",
          "Pemesanan makanan tanpa menunggu petugas",
        ],
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
