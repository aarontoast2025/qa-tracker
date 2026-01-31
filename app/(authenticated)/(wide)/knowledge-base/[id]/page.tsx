import { getPage } from "../actions";
import Editor from "../components/editor";
import { notFound } from "next/navigation";

export default async function KnowledgeBaseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    return null;
  }

  return (
    <Editor 
      pageId={page.id} 
      initialTitle={page.title} 
      initialContent={page.content}
      initialIcon={page.icon}
      initialCoverImage={page.cover_image}
      initialSource={page.source}
    />
  );
}
