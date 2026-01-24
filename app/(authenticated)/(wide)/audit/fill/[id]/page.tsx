import { getForm, getFormStructure } from "../../../actions";
import { notFound } from "next/navigation";
import { AuditFormRenderer } from "./components/audit-form-renderer";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AuditFillPage(props: PageProps) {
  const params = await props.params;
  const [form, structure] = await Promise.all([
    getForm(params.id),
    getFormStructure(params.id)
  ]);

  if (!form) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground mt-2">{form.description}</p>
        )}
      </div>
      
      <AuditFormRenderer structure={structure} />
    </div>
  );
}
