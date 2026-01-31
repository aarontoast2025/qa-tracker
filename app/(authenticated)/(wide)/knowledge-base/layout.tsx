import { getPages } from "./actions";
import { Sidebar } from "./components/sidebar";

export default async function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pages = await getPages();

  return (
    <div className="flex min-h-[calc(100vh-64px)] -mt-20 bg-background w-full">
      <div className="w-64 shrink-0 relative">
        <div className="sticky top-0 h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden">
            <Sidebar pages={pages} />
        </div>
      </div>
      <div className="flex-1 bg-white">
        {children}
      </div>
    </div>
  );
}