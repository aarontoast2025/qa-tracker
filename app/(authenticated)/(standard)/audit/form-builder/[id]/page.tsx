import { getForm, getFormStructure } from "../../actions";
import { FormBuilderClient } from "./components/form-builder-client";
import { hasPermission } from "@/lib/supabase/permissions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FormBuilderDetailPage(props: PageProps) {
  const params = await props.params;
  const canView = await hasPermission("form.view");
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [form, structure] = await Promise.all([
    getForm(params.id),
    getFormStructure(params.id)
  ]);

  if (!form) {
    notFound();
  }

  const canUpdate = await hasPermission("form.update");
  const canDelete = await hasPermission("form.delete");
  const canArchive = await hasPermission("form.archive");

  return (
    <FormBuilderClient 
      form={form} 
      initialStructure={structure} 
      permissions={{ canUpdate, canDelete, canArchive }}
    />
  );
}
