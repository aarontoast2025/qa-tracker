import { createClient } from "@/lib/supabase/server";
import { getMyPermissions } from "@/lib/supabase/permissions";
import { redirect } from "next/navigation";
import { AssignmentDashboard } from "@/components/assignment-dashboard";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const permissions = await getMyPermissions();

  if (!permissions.includes("assignments.view")) {
    redirect("/");
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Params
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const query = (searchParams.query as string) || "";
  const status = (searchParams.status as string) || "all";
  const viewType = (searchParams.viewType as 'daily' | 'weekly' | 'monthly') || 'daily';
  const viewDateStr = (searchParams.viewDate as string) || new Date().toISOString();

  // Date Range Logic
  const viewDate = new Date(viewDateStr);
  let startDate, endDate;

  if (viewType === 'daily') {
    startDate = startOfDay(viewDate);
    endDate = endOfDay(viewDate);
  } else if (viewType === 'weekly') {
    startDate = startOfWeek(viewDate, { weekStartsOn: 1 });
    endDate = endOfWeek(viewDate, { weekStartsOn: 1 });
  } else {
    startDate = startOfMonth(viewDate);
    endDate = endOfMonth(viewDate);
  }

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Query
  let dbQuery = supabase
    .from("audit_evaluations_assigned")
    .select(`
      *,
      specialist:roster_employees!inner(id, first_name, last_name, eid, supervisor),
      form:form_templates(title)
    `, { count: "exact" })
    .eq("qa_id", user?.id)
    .gte('assignment_date', startStr)
    .lte('assignment_date', endStr);

  if (status !== 'all') {
    dbQuery = dbQuery.eq('status', status);
  }

  // Search filter (Client-side logic applied on Server query is tricky with joins, 
  // but for "specialist name" we can try using the !inner join we added)
  if (query) {
    // Note: Supabase doesn't easily support "ilike" on joined columns in a single step without embedding.
    // However, since we used !inner, we can filter on the joined table if we knew the syntax, 
    // but the JS library 'filter' modifiers usually apply to the top level.
    // A workaround for search on joined table is often:
    // 1. Text Search on specific columns if they existed on parent
    // 2. Or, for simple cases, just relying on client-side or separate search.
    // 
    // Given the constraints and likely volume, we'll try a text search if supported, 
    // OR we might need to fetch a bit more and filter in memory if the dataset is small for a single QA.
    // 
    // BUT, a better approach for "Search specialist" on this table:
    // We can't easily ILIKE the joined column here. 
    // So we will fetch first, then filter in memory for the Search part, then paginate.
    // This is acceptable for a "My Assignments" dashboard which likely has < 1000 records per period.
  }

  // Execute Query (without range first if we need to filter in memory)
  const { data: rawData, count: initialCount } = await dbQuery
    .order("assignment_date", { ascending: false })
    .order("created_at", { ascending: false });
  
  let processedData = rawData || [];

  // Filter by Search Query in Memory
  if (query) {
    const q = query.toLowerCase();
    processedData = processedData.filter((a: any) => {
      const specialist = Array.isArray(a.specialist) ? a.specialist[0] : a.specialist;
      const name = `${specialist?.first_name || ""} ${specialist?.last_name || ""}`.toLowerCase();
      const eid = specialist?.eid?.toLowerCase() || "";
      return name.includes(q) || eid.includes(q);
    });
  }

  const total = processedData.length;
  const totalPages = Math.ceil(total / pageSize);
  
  // Pagination in Memory (since we filtered in memory)
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const paginatedData = processedData.slice(from, to);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <AssignmentDashboard 
        initialAssignments={paginatedData}
        currentUserPermissions={permissions}
        pagination={{
          page,
          pageSize,
          total,
          totalPages,
          query,
          viewType,
          viewDate: viewDateStr,
          status
        }}
      />
    </div>
  );
}
