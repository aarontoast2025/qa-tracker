import { getMyPermissions } from "@/lib/supabase/permissions";
import { redirect } from "next/navigation";
import { AssignmentManager } from "@/components/assignment-manager";
import { getAssignmentData } from "./actions";

export default async function AssignmentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const permissions = await getMyPermissions();

  if (!permissions.includes("assignments.view")) {
    redirect("/");
  }

  const toArray = (val: string | string[] | undefined) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  // List 1 Params (Candidates)
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const query = (searchParams.query as string) || "";
  const skill = toArray(searchParams.skill);
  const channel = toArray(searchParams.channel);
  const supervisor = toArray(searchParams.supervisor);
  
  // List 2 Params (History)
  const aPage = Number(searchParams.aPage) || 1;
  const aPageSize = Number(searchParams.aPageSize) || 10;
  const aQuery = (searchParams.aQuery as string) || "";
  const aSkill = toArray(searchParams.aSkill);
  const aChannel = toArray(searchParams.aChannel);
  const aSupervisor = toArray(searchParams.aSupervisor);

  const viewType = (searchParams.viewType as 'daily' | 'weekly' | 'monthly') || 'daily';
  const viewDate = (searchParams.viewDate as string) || new Date().toISOString();

  const { 
    specialists, totalSpecialists, totalPages, 
    filterData, qas, forms, 
    assignments, totalAssignments, totalAssignmentPages, allFilteredAssignments 
  } = await getAssignmentData(page, pageSize, query, {
    skill,
    channel,
    supervisor,
    viewType,
    viewDate,
    assignQuery: aQuery,
    assignSkill: aSkill,
    assignChannel: aChannel,
    assignSupervisor: aSupervisor,
    assignPage: aPage,
    assignPageSize: aPageSize
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <AssignmentManager 
        specialists={specialists}
        filterData={filterData}
        qas={qas}
        forms={forms}
        initialAssignments={assignments}
        allFilteredAssignments={allFilteredAssignments}
        currentUserPermissions={permissions}
        pagination={{
          page,
          pageSize,
          total: totalSpecialists,
          totalPages,
          query,
          viewType,
          viewDate,
          filters: {
            skill,
            channel,
            supervisor
          }
        }}
        historyPagination={{
          page: aPage,
          pageSize: aPageSize,
          total: totalAssignments,
          totalPages: totalAssignmentPages,
          query: aQuery,
          filters: {
            skill: aSkill,
            channel: aChannel,
            supervisor: aSupervisor
          }
        }}
      />
    </div>
  );
}