import { getForms } from "./actions";
import { CreateFormButton } from "./components/create-form-button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil, ClipboardList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function FormBuilderPage() {
  const forms = await getForms();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
          <p className="text-muted-foreground">Create and manage your audit form templates.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CreateFormButton mode="card" />
        
        {forms?.map((form) => (
          <Card key={form.id} className="flex flex-col border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all">
            <CardHeader className="relative">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                  {form.status}
                </Badge>
              </div>
              <CardTitle className="mt-4 line-clamp-1 text-lg">{form.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {form.description || "No description provided."}
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full gap-2" variant="outline">
                <Link href={`/audit/form-builder/${form.id}`}>
                  <Pencil className="h-4 w-4" /> Edit Form
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}