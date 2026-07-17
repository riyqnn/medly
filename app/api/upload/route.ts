import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
