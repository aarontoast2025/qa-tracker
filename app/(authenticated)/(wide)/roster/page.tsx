import { getEmployees, getRosterMetadata } from "./actions";
import { RosterClient } from "./components/roster-client";
import { hasPermission } from "@/lib/supabase/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Roster | QA Tracker",
  description: "Employee Roster Management",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function RosterPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams
  // Check View Permission
  const canView = await hasPermission("roster.view");
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            You do not have permission to view the Roster.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check other permissions
  const [canAdd, canUpdate, canDelete] = await Promise.all([
    hasPermission("roster.add"),
    hasPermission("roster.update"),
    hasPermission("roster.delete"),
  ]);

  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const query = (searchParams.query as string) || "";
  const sort = (searchParams.sort as string) || "last_name";
  const order = (searchParams.order as "asc" | "desc") || "asc";

  const metadata = await getRosterMetadata();

  const toArray = (val: string | string[] | undefined) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  // Default Status Logic: If no status param, select all except "Termed"
  let statusFilters = toArray(searchParams.status);
  if (!searchParams.status) {
      statusFilters = metadata.statuses.filter(s => s !== "Termed");
  }

  const { data: employees, total, totalPages } = await getEmployees(
    page, 
    pageSize, 
    query, 
    statusFilters, 
    sort, 
    order,
    searchParams.role,
    searchParams.skill,
    searchParams.tier,
    searchParams.channel,
    searchParams.supervisor
  );

  const cleanArray = (val: string | string[] | undefined) => {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.filter(v => v !== "All");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roster</h1>
        <p className="text-muted-foreground">
          Manage employee information and roster details.
        </p>
      </div>
      
      <RosterClient 
        employees={employees} 
        pagination={{
            page,
            pageSize,
            totalPages,
            total,
            query,
            sort,
            order,
            filters: {
                status: statusFilters,
                role: cleanArray(searchParams.role),
                skill: cleanArray(searchParams.skill),
                tier: cleanArray(searchParams.tier),
                channel: cleanArray(searchParams.channel),
                supervisor: cleanArray(searchParams.supervisor),
            }
        }}
        permissions={{ canAdd, canUpdate, canDelete }}
        metadata={metadata}
      />
    </div>
  );
}

    

  