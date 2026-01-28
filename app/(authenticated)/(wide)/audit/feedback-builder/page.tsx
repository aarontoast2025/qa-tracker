import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";

export default async function FeedbackBuilderPage() {
  const supabase = await createClient();
  
  const { data: forms } = await supabase
    .from('form_templates')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback Builder</h1>
        <p className="text-muted-foreground">Manage automated feedback templates for your audit forms.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms?.map((form) => (
          <Card key={form.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {form.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {form.description || "No description provided."}
              </p>
              <Button asChild className="w-full gap-2">
                <Link href={`/audit/feedback-builder/${form.id}`}>
                  Edit Templates <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
