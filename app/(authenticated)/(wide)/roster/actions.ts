"use server";

import { createClient } from "@/lib/supabase/server";
import { Employee, EmployeeInput, RosterMetadata } from "./types";
import { revalidatePath } from "next/cache";

export async function getEmployees(
  page = 1, 
  pageSize = 50, 
  query = "", 
  status: string | string[] = [],
  sortColumn = "last_name",
  sortDirection: "asc" | "desc" = "asc",
  role: string | string[] = [],
  skill: string | string[] = [],
  tier: string | string[] = [],
  channel: string | string[] = [],
  supervisor: string | string[] = []
) {
  const supabase = await createClient();
  
  let queryBuilder = supabase
    .from("roster_employees")
    .select("*", { count: "exact" });

  if (query) {
    queryBuilder = queryBuilder.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,eid.ilike.%${query}%,toasttab_email.ilike.%${query}%`
    );
  }

  const applyFilter = (field: string, value: string | string[]) => {
    const values = Array.isArray(value) ? value : (value ? [value] : []);
    const cleanValues = values.filter(v => v !== "All" && v.trim() !== "");
    if (cleanValues.length > 0) {
      queryBuilder = queryBuilder.in(field, cleanValues);
    }
  };

  applyFilter("status", status);
  applyFilter("role", role);
  applyFilter("skill", skill);
  applyFilter("tier", tier);
  applyFilter("channel", channel);
  applyFilter("supervisor", supervisor);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await queryBuilder
    .order(sortColumn, { ascending: sortDirection === "asc" })
    .range(from, to);

  if (error) {
    console.error("Error fetching employees:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  return {
    data: data as Employee[],
    total: count || 0,
    page,
    pageSize,
    totalPages: count ? Math.ceil(count / pageSize) : 0
  };
}

export async function getRosterMetadata() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_roster_metadata');

  if (error) {
    console.error("Error fetching roster metadata:", error);
    return {
      roles: [],
      locations: [],
      skills: [],
      channels: [],
      tiers: [],
      waves: [],
      statuses: [],
      supervisors: [],
      managers: []
    } as RosterMetadata;
  }

  return data as RosterMetadata;
}

export async function addEmployee(employee: EmployeeInput) {
  const supabase = await createClient();

  // Check for duplicate EID
  const { data: existing } = await supabase
    .from("roster_employees")
    .select("id")
    .eq("eid", employee.eid)
    .single();

  if (existing) {
    return { error: `Employee with EID ${employee.eid} already exists.` };
  }

  const { data, error } = await supabase
    .from("roster_employees")
    .insert([employee])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/roster");
  return { success: true, data };
}

export async function bulkAddEmployees(employees: EmployeeInput[]) {
  const supabase = await createClient();
  const errors: string[] = [];
  let addedCount = 0;

  // We can process in batches or one by one. One by one allows specific error reporting per row.
  // Given standard bulk sizes (dozens to hundreds), one-by-one with parallel promises is okay, 
  // but a loop is safer for rate limits.
  // Ideally, we'd fetch all existing EIDs first to filter efficiently.

  const eidsToCheck = employees.map(e => e.eid).filter(Boolean);
  
  if (eidsToCheck.length === 0) {
    return { success: false, errors: ["No valid EIDs found in the upload."], addedCount: 0, skippedCount: 0 };
  }

  // Fetch existing EIDs
  const { data: existingEmployees, error: fetchError } = await supabase
    .from("roster_employees")
    .select("eid")
    .in("eid", eidsToCheck);

  if (fetchError) {
    return { success: false, errors: [`Database error checking duplicates: ${fetchError.message}`], addedCount: 0, skippedCount: 0 };
  }

  const existingEids = new Set(existingEmployees?.map(e => e.eid));
  const newEmployees = [];

  for (const emp of employees) {
    if (existingEids.has(emp.eid)) {
      errors.push(`Skipped duplicate EID: ${emp.eid}`);
      continue;
    }
    newEmployees.push(emp);
  }

  if (newEmployees.length > 0) {
    // Insert in batches of 50 to avoid payload limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < newEmployees.length; i += BATCH_SIZE) {
      const batch = newEmployees.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("roster_employees")
        .insert(batch);
      
      if (insertError) {
        errors.push(`Batch insert error (rows ${i+1}-${i+batch.length}): ${insertError.message}`);
      } else {
        addedCount += batch.length;
      }
    }
  }

  revalidatePath("/roster");
  return { 
    success: true, 
    addedCount, 
    skippedCount: employees.length - newEmployees.length, 
    errors 
  };
}

export async function updateEmployee(id: string, employee: Partial<EmployeeInput>) {
  const supabase = await createClient();

  // If EID is being updated, check for duplicates (excluding self)
  if (employee.eid) {
     const { data: existing } = await supabase
      .from("roster_employees")
      .select("id")
      .eq("eid", employee.eid)
      .neq("id", id)
      .single();

    if (existing) {
      return { error: `Employee with EID ${employee.eid} already exists.` };
    }
  }

  const { error } = await supabase
    .from("roster_employees")
    .update(employee)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/roster");
  return { success: true };
}

export async function deleteEmployee(id: string) {

  const supabase = await createClient();



  const { error } = await supabase

    .from("roster_employees")

    .delete()

    .eq("id", id);



  if (error) {

    return { error: error.message };

  }



  revalidatePath("/roster");

  return { success: true };

}



export async function deleteEmployees(ids: string[]) {

  const supabase = await createClient();



  const { error } = await supabase

    .from("roster_employees")

    .delete()

    .in("id", ids);



  if (error) {

    return { error: error.message };

  }



  revalidatePath("/roster");

  return { success: true };

}

export async function bulkUpdateEmployees(ids: string[], updates: Partial<EmployeeInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("roster_employees")
    .update(updates)
    .in("id", ids);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/roster");
  return { success: true };
}
