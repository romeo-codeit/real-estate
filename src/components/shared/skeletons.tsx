import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-4 w-[350px]" />
                </div>
                <Skeleton className="h-10 w-[120px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[120px] mb-2" />
                            <Skeleton className="h-3 w-[150px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-[300px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-[200px] mb-2" />
                        <Skeleton className="h-4 w-[300px]" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[100px]" />
                                        <Skeleton className="h-3 w-[80px]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[80px]" />
                                    <Skeleton className="h-4 w-[60px]" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="h-[300px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-[150px] mb-2" />
                        <Skeleton className="h-4 w-[250px]" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function StatsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px] mb-2" />
                        <Skeleton className="h-3 w-[150px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function TableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between pb-4 border-b">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-4 w-[100px]" />
                            ))}
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <Skeleton key={j} className="h-4 w-[100px]" />
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function CardGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>
            <Card>
                <CardContent className="p-6 space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-[120px]" />
                </CardContent>
            </Card>
        </div>
    )
}
