"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
