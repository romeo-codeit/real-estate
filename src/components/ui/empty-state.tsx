import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    actionLink?: string;
}

export function EmptyState({
    title = "No posts found",
    description = "We couldn't find any blog posts at the moment. Please check back later.",
    actionLabel = "Return Home",
    actionLink = "/",
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border border-border rounded-lg shadow-sm">
            <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <FileText className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
            <p className="text-muted-foreground max-w-md mb-8 text-lg">
                {description}
            </p>
            {actionLink && (
                <Button asChild variant="default" size="lg">
                    <Link href={actionLink}>{actionLabel}</Link>
                </Button>
            )}
        </div>
    );
}
