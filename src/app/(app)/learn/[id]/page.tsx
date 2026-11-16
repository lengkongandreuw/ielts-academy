import { LESSONS } from "@/lib/content";
import { LessonView } from "@/components/LessonWorkspace";

export const dynamicParams = false;
export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonView id={id} />;
}
