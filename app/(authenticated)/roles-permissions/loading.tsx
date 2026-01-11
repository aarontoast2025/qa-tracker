import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RolesPermissionsLoading() {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Role Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((card) => (
          <Card key={card} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Groups Table Skeleton */}
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((group) => (
              <div key={group} className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 p-4">
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2].map((row) => (
                    <div key={row} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
