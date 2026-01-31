"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, FileText, Trash2, MoreHorizontal, AlertTriangle, Trash, X, Search as SearchIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPage, deletePage, searchPages } from "../actions";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarProps {
  pages: any[];
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function Sidebar({ pages }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleCreate = async () => {
    try {
      const newPage = await createPage();
      router.push(`/knowledge-base/${newPage.id}`);
      toast.success("New page created");
    } catch (error) {
      toast.error("Failed to create page");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;
    
    setIsDeleting(true);
    try {
      await deletePage(pageToDelete);
      if (pathname.includes(pageToDelete)) {
        router.push("/knowledge-base");
      }
      toast.success("Page deleted");
    } catch (error) {
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
    }
  };

  const performSearch = useMemo(
    () => debounce(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        
        setIsSearching(true);
        try {
            const results = await searchPages(query);
            setSearchResults(results);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const displayPages = searchQuery ? searchResults : pages;

  return (
    <div className="w-64 h-full flex flex-col bg-muted/10 shrink-0 overflow-x-hidden">
      <div className="p-4 border-b flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
            Pages
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            </Button>
        </div>
        
        {/* Search Input */}
        <div className="relative group">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">
        {displayPages.map((page) => (
          <div key={page.id} className="relative group">
            <Link
              href={`/knowledge-base/${page.id}`}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200",
                pathname === `/knowledge-base/${page.id}`
                  ? "bg-white shadow-sm text-foreground font-semibold"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {page.icon ? (
                <span className="w-4 h-4 flex items-center justify-center text-xs shrink-0">{page.icon}</span>
              ) : (
                <FileText className="h-4 w-4 shrink-0 opacity-50" />
              )}
              <span className="truncate flex-1 text-[13px]">{page.title || "Untitled"}</span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto hover:bg-muted"
                    >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium text-xs"
                        onClick={(e) => {
                            e.preventDefault();
                            setPageToDelete(page.id);
                        }}
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete Page
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Link>
          </div>
        ))}
        {displayPages.length === 0 && (
            <div className="text-center py-12 px-4 text-[10px] text-muted-foreground italic font-medium uppercase tracking-wider opacity-50">
                {searchQuery ? "No matches found" : "No pages yet"}
            </div>
        )}
      </div>

      <AlertDialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Page?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this page? All content will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting} className="font-bold uppercase tracking-wider text-[10px] h-9 gap-2">
              <X className="h-3.5 w-3.5" /> Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 font-bold uppercase tracking-wider text-[10px] h-9 gap-2"
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash className="h-3.5 w-3.5" /> Delete Page
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
