import { FileText } from "lucide-react";

export default function KnowledgeBasePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
      <FileText className="h-12 w-12 opacity-10 mb-4" />
      <h3 className="font-medium">Select a page to view or edit</h3>
      <p className="text-sm opacity-60">or create a new one using the + button</p>
    </div>
  );
}
