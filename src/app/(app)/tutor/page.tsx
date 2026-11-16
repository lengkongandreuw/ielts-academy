import { Suspense } from "react";
import { TutorPage } from "@/components/TutorPage";

export default function Tutor() {
  return (
    <Suspense>
      <TutorPage />
    </Suspense>
  );
}
