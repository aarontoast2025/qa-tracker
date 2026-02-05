"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/supabase/permissions";
import { Specialist, Assignment } from "./types";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export async function getAssignmentData(
  page = 1,
  pageSize = 10,
  query = "",
  filters: {
    skill?: string[];
    channel?: string[];
    supervisor?: string[];
    viewType?: 'daily' | 'weekly' | 'monthly';
    viewDate?: string;
    assignQuery?: string;
    assignSkill?: string[];
    assignChannel?: string[];
    assignSupervisor?: string[];
    assignPage?: number;
    assignPageSize?: number;
  } = {}
) {
  const supabase = await createClient();

  // 1. Prepare Specialist Candidates Query
  let specialistQuery = supabase
    .from("roster_employees")
    .select("id, first_name, last_name, eid, role, skill, channel, supervisor, status", { count: "exact" })
    .in("role", ["Agent", "SME"])
    .eq("status", "Active");

  if (query) {
    const searchTerms = query.trim().split(/\s+/);
    if (searchTerms.length > 1) {
      // For multi-word search, try to match both first and last name parts
      // This is a common pattern for "John Doe" -> first_name ~ John AND last_name ~ Doe
      specialistQuery = specialistQuery.ilike("first_name", `%${searchTerms[0]}%`).ilike("last_name", `%${searchTerms[searchTerms.length - 1]}%`);
    } else {
      specialistQuery = specialistQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,eid.ilike.%${query}%`
      );
    }
  }

  if (filters.skill?.length) specialistQuery = specialistQuery.in("skill", filters.skill);
  if (filters.channel?.length) specialistQuery = specialistQuery.in("channel", filters.channel);
  if (filters.supervisor?.length) specialistQuery = specialistQuery.in("supervisor", filters.supervisor);

  const from = (page - 1) * pageSize;
  const paginatedSpecialistQuery = specialistQuery
    .order("first_name", { ascending: true })
    .range(from, from + pageSize - 1);

  // 2. Prepare Assignments Query
  const viewDate = filters.viewDate ? new Date(filters.viewDate) : new Date();
  let startDate, endDate;

  if (filters.viewType === 'daily') {
    startDate = startOfDay(viewDate);
    endDate = endOfDay(viewDate);
  } else if (filters.viewType === 'weekly') {
    startDate = startOfWeek(viewDate, { weekStartsOn: 1 });
    endDate = endOfWeek(viewDate, { weekStartsOn: 1 });
  } else {
    startDate = startOfMonth(viewDate);
    endDate = endOfMonth(viewDate);
  }

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  let baseAssignmentQuery = supabase
    .from("audit_evaluations_assigned")
    .select(`
      *,
      qa:user_profiles(id, first_name, last_name, avatar_url),
      specialist:roster_employees!inner(id, first_name, last_name, eid, role, skill, channel, supervisor, status),
      form:form_templates(title)
    `, { count: "exact" })
    .gte('assignment_date', startStr)
    .lte('assignment_date', endStr);

  // Apply filters on specialist fields
  if (filters.assignSkill?.length) baseAssignmentQuery = baseAssignmentQuery.in("specialist.skill", filters.assignSkill);
  if (filters.assignChannel?.length) baseAssignmentQuery = baseAssignmentQuery.in("specialist.channel", filters.assignChannel);
  if (filters.assignSupervisor?.length) baseAssignmentQuery = baseAssignmentQuery.in("specialist.supervisor", filters.assignSupervisor);

  const aPage = filters.assignPage || 1;
  const aPageSize = filters.assignPageSize || 10;
  const aFrom = (aPage - 1) * aPageSize;

  // Fetch all assignments matching the base filters (without pagination yet)
  const { data: allAssignmentsData } = await baseAssignmentQuery
    .order("assignment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, 9999); // Fetch more to allow client-side filtering

  // Apply search filter on the fetched data
  // Note: We filter client-side because Supabase doesn't support filtering on joined table columns directly
  let filteredAssignments = allAssignmentsData || [];
  if (filters.assignQuery) {
    const aQuery = filters.assignQuery.trim().toLowerCase();
    const searchTerms = aQuery.split(/\s+/).filter(Boolean);
    
    filteredAssignments = filteredAssignments.filter((assignment: any) => {
      const specFirstName = assignment.specialist?.first_name?.toLowerCase() || '';
      const specLastName = assignment.specialist?.last_name?.toLowerCase() || '';
      const specEid = assignment.specialist?.eid?.toLowerCase() || '';
      const qaFirstName = assignment.qa?.first_name?.toLowerCase() || '';
      const qaLastName = assignment.qa?.last_name?.toLowerCase() || '';
      
      const fullSpecName = `${specFirstName} ${specLastName}`.trim();
      const fullQaName = `${qaFirstName} ${qaLastName}`.trim();
      
      // For multi-word searches, check if all terms are present in the combined text
      if (searchTerms.length > 1) {
        const combinedSpecText = `${fullSpecName} ${specEid}`.toLowerCase();
        const combinedQaText = fullQaName.toLowerCase();
        
        const allTermsInSpec = searchTerms.every(term => combinedSpecText.includes(term));
        const allTermsInQa = searchTerms.every(term => combinedQaText.includes(term));
        
        return allTermsInSpec || allTermsInQa;
      }
      
      // For single word searches, check individual fields
      return (
        specFirstName.includes(aQuery) ||
        specLastName.includes(aQuery) ||
        fullSpecName.includes(aQuery) ||
        specEid.includes(aQuery) ||
        qaFirstName.includes(aQuery) ||
        qaLastName.includes(aQuery) ||
        fullQaName.includes(aQuery)
      );
    });
  }

  // Now paginate the filtered results
  const totalFilteredCount = filteredAssignments.length;
  const paginatedAssignments = filteredAssignments.slice(aFrom, aFrom + aPageSize);

  // 3. Fetch other data in parallel
  const [
    { data: specialists, count: specCount },
    { data: filterData },
    { data: users },
    { data: forms }
  ] = await Promise.all([
    paginatedSpecialistQuery,
    supabase.from("roster_employees").select("skill, channel, supervisor").in("role", ["Agent", "SME"]).eq("status", "Active"),
    supabase.from("user_profiles").select(`id, first_name, last_name, company_email, role_id, user_roles (name)`).eq('is_suspended', false),
    supabase.from("form_templates").select("id, title").eq("status", "active")
  ]);

  const formattedQAs = (users || []).map(u => ({
    ...u,
    user_roles: Array.isArray(u.user_roles) ? u.user_roles[0] : u.user_roles
  }));

  return {
    specialists: (specialists || []) as Specialist[],
    totalSpecialists: specCount || 0,
    totalPages: specCount ? Math.ceil(specCount / pageSize) : 0,
    filterData: filterData || [],
    qas: formattedQAs,
    forms: forms || [],
    assignments: paginatedAssignments as Assignment[],
    totalAssignments: totalFilteredCount,
    totalAssignmentPages: totalFilteredCount ? Math.ceil(totalFilteredCount / aPageSize) : 0,
    allFilteredAssignments: filteredAssignments as Assignment[]
  };
}

export async function createAssignments(assignments: {
  qa_id: string;
  specialist_id: string;
  form_id: string | null;
  assignment_date: string | null;
  supervisor: string | null;
}[]) {
  try {
    const canManage = await hasPermission('assignments.manage');
    if (!canManage) return { error: "You do not have permission to manage assignments." };
    const supabase = await createClient();
    const { data, error } = await supabase.from("audit_evaluations_assigned").insert(assignments).select();
    if (error) return { error: error.message };
    revalidatePath("/audit/assignments");
    revalidatePath("/audit/dashboard");
    return { data };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteAssignment(id: string) {
  try {
    const canManage = await hasPermission('assignments.manage');
    if (!canManage) return { error: "You do not have permission to delete assignments." };
    const supabase = await createClient();
    const { error } = await supabase.from("audit_evaluations_assigned").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/audit/assignments");
    revalidatePath("/audit/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updateAssignmentStatus(id: string, status: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: assignment } = await supabase.from("audit_evaluations_assigned").select("qa_id").eq("id", id).single();
    const canManage = await hasPermission('assignments.manage');
    const isOwner = assignment?.qa_id === user?.id;
    if (!isOwner && !canManage) return { error: "You do not have permission to update this assignment." };
    const { error } = await supabase.from("audit_evaluations_assigned").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/audit/assignments");
    revalidatePath("/audit/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}
