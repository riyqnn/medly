import { NextRequest, NextResponse } from "next/server";
import { getCaller, denied } from "@/src/features/auth/utils/require";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  // This pins files to the hospital's own Pinata account and used to run with
  // no auth at all — anything that reached it got uploaded, by anyone.
  const caller = await getCaller();
  if (denied(caller)) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya berkas gambar yang diizinkan." }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 2 MB." }, { status: 413 });
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json({ error: "Pinata JWT is not configured in .env" }, { status: 500 });
    }

    // Forward the FormData to Pinata
    const pinataData = new FormData();
    pinataData.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: pinataData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Pinata upload failed: ${errorText}` }, { status: 500 });
    }

    const data = await res.json();
    const ipfsHash = data.IpfsHash;
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";
    const fileUrl = `${gateway}/${ipfsHash}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
