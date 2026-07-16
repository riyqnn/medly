import Link from "next/link";
import { RegisterForm } from "@/src/features/auth/components/RegisterForm";
import { AuthShell } from "@/src/features/auth/components/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Daftarkan rumah sakit"
      subtitle="Buat workspace Medly dan akun admin pertama Anda."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="row-link">
            Masuk di sini
          </Link>
        </>
      }
      pitch={{
        heading: "Siapkan sekali, langsung terasa di setiap tempat tidur.",
        body: "Daftarkan rumah sakit Anda, tambahkan dokter dan perawat, lalu buka layar Medly untuk pasien mana pun langsung dari daftar pasien.",
        points: [
          "Data pasien, dokter, dan kamar dalam satu tempat",
          "Akun dokter dan perawat dibuat oleh admin",
          "Kelola menu, edukasi, dan hiburan pasien",
        ],
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
