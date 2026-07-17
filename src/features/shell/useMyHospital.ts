"use client";

import { useEffect, useState } from "react";

export type MyHospital = { name: string | null; logo_url: string | null };

/** The logged-in user's hospital identity, for branding client-side portals. */
export function useMyHospital(): MyHospital {
  const [hospital, setHospital] = useState<MyHospital>({ name: null, logo_url: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/my-hospital");
      if (res.ok && alive) setHospital(await res.json());
    })();
    return () => {
      alive = false;
    };
  }, []);

  return hospital;
}
