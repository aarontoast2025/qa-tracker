"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { updatePage } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Smile, ImageIcon, X, Link as LinkIcon, Upload, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface EditorProps {
  pageId: string;
  initialTitle: string;
  initialContent: any;
  initialIcon?: string;
  initialCoverImage?: string;
  initialSource?: string;
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

// Simplified custom theme for 0.46.x
const customTheme = {
  colors: {
    editor: {
      text: "#222222",
      background: "#ffffff",
    },
  },
  borderRadius: 4,
  fontFamily: "Inter, sans-serif",
} as any;

export default function Editor({ 
  pageId, 
  initialTitle, 
  initialContent,
  initialIcon,
  initialCoverImage,
  initialSource
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [icon, setIcon] = useState(initialIcon || "");
  const [coverImage, setCoverImage] = useState(initialCoverImage || "");
  const [source, setSource] = useState(initialSource || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unsplashSearch, setUnsplashSearch] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize editor
  const editor = useCreateBlockNote({
    initialContent: initialContent && Array.isArray(initialContent) && initialContent.length > 0 
      ? (initialContent as PartialBlock[]) 
      : undefined,
  });

  const saveContent = useCallback(
    async (
      currentTitle: string, 
      currentContent: any, 
      currentIcon: string, 
      currentCover: string,
      currentSource: string
    ) => {
      setIsSaving(true);
      try {
        await updatePage(pageId, {
          title: currentTitle,
          content: currentContent,
          icon: currentIcon || null,
          cover_image: currentCover || null,
          source: currentSource || null,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to save", error);
      } finally {
        setIsSaving(false);
      }
    },
    [pageId]
  );

  const debouncedSave = useMemo(
    () => debounce(saveContent, 1000),
    [saveContent]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle, editor.document, icon, coverImage, source);
  };

  const handleIconChange = (newIcon: string) => {
    setIcon(newIcon);
    debouncedSave(title, editor.document, newIcon, coverImage, source);
  };

  const handleCoverChange = (newCover: string) => {
    setCoverImage(newCover);
    debouncedSave(title, editor.document, icon, newCover, source);
  };

  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    debouncedSave(title, editor.document, icon, coverImage, newSource);
  };

  const handleEditorChange = () => {
    debouncedSave(title, editor.document, icon, coverImage, source);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${pageId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from('knowledge_base_assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('knowledge_base_assets')
            .getPublicUrl(filePath);

        handleCoverChange(publicUrl);
        toast.success("Cover image uploaded");
    } catch (error: any) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
    } finally {
        setIsUploading(false);
    }
  };

  const searchUnsplash = async () => {
    if (!unsplashSearch.trim()) return;
    
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
        toast.error("Unsplash Access Key not configured");
        return;
    }

    setIsSearchingUnsplash(true);
    try {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashSearch)}&per_page=12&client_id=${accessKey}`);
        const data = await res.json();
        setUnsplashResults(data.results || []);
    } catch (err) {
        toast.error("Unsplash search failed");
    } finally {
        setIsSearchingUnsplash(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-full pb-20">
      {/* Cover Image Area */}
      {coverImage && (
        <div className="group relative w-full h-72 bg-muted/20 shrink-0 z-0 overflow-hidden">
             <img 
                src={coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80"; 
                }}
             />
             <Button 
                variant="secondary" 
                size="sm" 
                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2 shadow-sm font-bold uppercase tracking-wider text-[10px]"
                onClick={() => handleCoverChange("")}
             >
                <X className="h-4 w-4" /> Remove Cover
             </Button>
        </div>
      )}

      <div className="w-full relative">
        <div className={cn(
            "max-w-4xl mx-auto px-12 relative group/header transition-all duration-300",
            coverImage ? "pt-16" : "pt-24"
        )}>
            {/* Hover Actions Bar */}
            <div className="flex items-center gap-2 mb-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                {!icon && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground gap-1.5 px-2 font-medium text-xs">
                                <Smile className="h-4 w-4" /> Add icon
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
                            <EmojiPicker 
                                onEmojiClick={(emojiData) => handleIconChange(emojiData.emoji)}
                                autoFocusSearch={true}
                            />
                        </PopoverContent>
                    </Popover>
                )}
                {!coverImage && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground gap-1.5 px-2 font-medium text-xs">
                                <ImageIcon className="h-4 w-4" /> Add cover
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 overflow-hidden shadow-2xl border-none" align="start">
                            <Tabs defaultValue="upload" className="w-full">
                                <TabsList className="w-full rounded-none h-10 bg-muted/50">
                                    <TabsTrigger value="upload" className="flex-1 gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <Upload className="h-3.5 w-3.5" /> Upload
                                    </TabsTrigger>
                                    <TabsTrigger value="unsplash" className="flex-1 gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <Search className="h-3.5 w-3.5" /> Unsplash
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="p-4 m-0">
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                        <div className="text-center">
                                            <p className="text-xs font-bold">Click to upload</p>
                                        </div>
                                        {isUploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    </div>
                                </TabsContent>
                                <TabsContent value="unsplash" className="p-0 m-0">
                                    <div className="p-2 border-b bg-muted/20">
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="Search photos..." 
                                                value={unsplashSearch}
                                                onChange={(e) => setUnsplashSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                                                className="h-8 text-xs"
                                            />
                                            <Button size="sm" className="h-8" onClick={searchUnsplash} disabled={isSearchingUnsplash}>
                                                {isSearchingUnsplash ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 p-1 max-h-[240px] overflow-y-auto bg-muted/10">
                                        {unsplashResults.map((img) => (
                                            <div 
                                                key={img.id} 
                                                className="aspect-video relative group/img cursor-pointer overflow-hidden rounded-sm"
                                                onClick={() => handleCoverChange(img.urls.regular)}
                                            >
                                                <img src={img.urls.thumb} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* Icon Area */}
            {icon && (
                <div className={cn(
                    "relative z-20 w-fit group/icon transition-all duration-300",
                    coverImage ? "-mt-32 mb-8" : "mb-6"
                )}>
                    <div className="text-[5rem] leading-none select-none cursor-pointer hover:opacity-90 transition-opacity relative group/emoji">
                        <Popover>
                            <PopoverTrigger asChild>
                                <span>{icon}</span>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
                                <EmojiPicker 
                                    onEmojiClick={(emojiData) => handleIconChange(emojiData.emoji)}
                                    autoFocusSearch={true}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-muted/80 backdrop-blur-sm border shadow-sm opacity-0 group-hover/emoji:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleIconChange("");
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Title & Metadata */}
            <div className="space-y-4 mb-10">
                <textarea
                    value={title}
                    onChange={handleTitleChange}
                    rows={1}
                    className="w-full text-4xl font-bold border-none shadow-none focus-visible:outline-none px-0 h-auto placeholder:text-muted-foreground/20 bg-transparent tracking-tight leading-tight resize-none overflow-hidden"
                    placeholder="Untitled"
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />
                
                {/* Source Field */}
                <div className="flex items-center gap-2 group/source transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-muted-foreground/60 min-w-[80px]">
                        <LinkIcon className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Source</span>
                    </div>
                    <Input 
                        value={source}
                        onChange={(e) => handleSourceChange(e.target.value)}
                        className="h-8 border-transparent hover:border-input focus:border-input bg-transparent px-2 w-full max-w-md transition-all text-sm text-muted-foreground font-medium"
                        placeholder="Add a source URL or reference..."
                    />
                </div>

                <div className="text-xs text-muted-foreground h-4">
                    {isSaving ? (
                        <span className="flex items-center gap-1 opacity-50 font-bold uppercase tracking-widest text-[9px]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving Changes
                        </span>
                    ) : (
                        <span className="opacity-0">All changes saved</span>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="-ml-12 w-[calc(100%+6rem)] knowledgebase-editor">
                <BlockNoteView 
                    editor={editor} 
                    onChange={handleEditorChange} 
                    theme="light"
                />
            </div>
        </div>
      </div>
    </div>
  );
}
