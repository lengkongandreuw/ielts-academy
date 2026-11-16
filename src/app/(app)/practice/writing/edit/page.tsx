"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WritingWorkspace } from "@/components/WritingWorkspace";

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  return <WritingWorkspace key={id} id={id} />;
}

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
