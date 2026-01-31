"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPages() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("knowledge_base_pages")
    .select("id, title, icon, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getPage(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("knowledge_base_pages")
    .select("id, title, content, icon, cover_image, source, updated_at")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("knowledge_base_pages")
    .insert({
      title: "Untitled",
      content: []
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/knowledge-base");
  return data;
}

async function deleteOldImage(url: string | null) {
    if (!url) return;
    if (url.includes("/storage/v1/object/public/knowledge_base_assets/")) {
        try {
            const supabase = await createClient();
            const fileName = url.split("/").pop();
            if (fileName) {
                await supabase.storage
                    .from("knowledge_base_assets")
                    .remove([fileName]);
            }
        } catch (err) {
            console.error("Failed to delete old image from storage:", err);
        }
    }
}

export async function updatePage(id: string, updates: any) {
  const supabase = await createClient();
  
  if (updates.hasOwnProperty('cover_image')) {
    const { data: currentPage } = await supabase
        .from("knowledge_base_pages")
        .select("cover_image")
        .eq("id", id)
        .single();
    
    if (currentPage && currentPage.cover_image !== updates.cover_image) {
        await deleteOldImage(currentPage.cover_image);
    }
  }

  const { error } = await supabase
    .from("knowledge_base_pages")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/knowledge-base");
  revalidatePath(`/knowledge-base/${id}`);
}

export async function deletePage(id: string) {
  const supabase = await createClient();
  
  const { data: page } = await supabase
    .from("knowledge_base_pages")
    .select("cover_image")
    .eq("id", id)
    .single();

  if (page?.cover_image) {
    await deleteOldImage(page.cover_image);
  }

  const { error } = await supabase
    .from("knowledge_base_pages")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/knowledge-base");
}

export async function searchPages(query: string) {
    if (!query.trim()) return [];
    
    const supabase = await createClient();
    
    // Simple search using ILIKE on title
    // For more advanced search, we could use Supabase's full-text search feature
    const { data, error } = await supabase
        .from("knowledge_base_pages")
        .select("id, title, icon, updated_at")
        .ilike("title", `%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Search error:", error);
        return [];
    }
            
    return data || [];
}
