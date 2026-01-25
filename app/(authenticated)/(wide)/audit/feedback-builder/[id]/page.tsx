import { notFound } from "next/navigation";
import { getFormWithFeedback } from "../actions";
import { FeedbackBuilderClient } from "./components/feedback-builder-client";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FeedbackBuilderEditorPage(props: PageProps) {
  const params = await props.params;
  const form = await getFormWithFeedback(params.id);

  if (!form) {
    notFound();
  }

  return <FeedbackBuilderClient form={form} />;
}
