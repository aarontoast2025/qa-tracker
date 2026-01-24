import { getForm, getFormStructure } from "@/app/(authenticated)/(standard)/audit/actions";
import { notFound } from "next/navigation";
import { AuditFormRenderer } from "@/app/(authenticated)/(wide)/audit/fill/[id]/components/audit-form-renderer";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AuditEmbedPage(props: PageProps) {
  const params = await props.params;
  const [form, structure] = await Promise.all([
    getForm(params.id),
    getFormStructure(params.id)
  ]);

  if (!form) {
    notFound();
  }

  return (
    <div className="w-full py-4 px-4">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground text-xs mt-1">{form.description}</p>
        )}
      </div>
      
      <AuditFormRenderer structure={structure} />
    </div>
  );
}
