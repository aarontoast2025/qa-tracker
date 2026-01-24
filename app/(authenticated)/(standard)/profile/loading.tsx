import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      {/* Profile Header Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Tabs Skeleton */}
        <div className="flex w-full border-b">
          {[1, 2, 3].map((tab) => (
            <div key={tab} className="px-8 py-3 border-b-2 border-transparent">
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Card Content Skeleton */}
        <Card className="border-t-4 border-t-primary shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button Skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
