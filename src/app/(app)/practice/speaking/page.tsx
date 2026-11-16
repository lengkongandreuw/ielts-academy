"use client";
import { Suspense } from "react";
import { SpeakingStudio } from "@/components/SpeakingStudio";

export default function Page() {
  return (
    <Suspense>
      <SpeakingStudio />
    </Suspense>
  );
}
