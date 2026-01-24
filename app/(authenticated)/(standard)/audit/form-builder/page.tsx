import { getForms } from "../actions";
import { CreateFormModal } from "./components/create-form-modal";
import { hasPermission } from "@/lib/supabase/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Form Builder | QA Tracker",
  description: "Create and manage audit forms",
};

export default async function FormBuilderPage() {
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

  const canAdd = await hasPermission("form.add");
  const forms = await getForms();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
          <p className="text-muted-foreground">
            Create and manage audit forms for QA evaluations.
          </p>
        </div>
        {canAdd && <CreateFormModal />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Link key={form.id} href={`/audit/form-builder/${form.id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {form.title}
                </CardTitle>
                <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                  {form.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                    {form.description || "No description provided."}
                </CardDescription>
                <div className="flex items-center text-sm text-muted-foreground mt-4 gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Updated {new Date(form.updated_at).toLocaleDateString()}</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {forms.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No forms found. Create one to get started.
            </div>
        )}
      </div>
    </div>
  );
}
