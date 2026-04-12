import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

interface ThemedCardHeaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

interface ThemedCardContentProps {
  children: ReactNode;
  className?: string;
}

// Main card component with proper dark theme styling
export function ThemedCard({ children, className, hover = true }: ThemedCardProps) {
  return (
    <Card className={cn(
      // Brand guide card styling
      "bg-white dark:bg-neutral-900/80 dark:backdrop-blur-md",
      "border-gray-200 dark:border-neutral-700/60",
      // Hover effects
      hover && "hover:shadow-md dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:scale-[1.02] hover:-translate-y-1",
      "transition-all duration-200 ease-in-out",
      className
    )}>
      {children}
    </Card>
  );
}

// Header component with proper text colors
export function ThemedCardHeader({ title, description, children, className }: ThemedCardHeaderProps) {
  return (
    <CardHeader className={cn("pb-4 sm:pb-6", className)}>
      {title && (
        <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
          {title}
        </CardTitle>
      )}
      {description && (
        <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {description}
        </CardDescription>
      )}
      {children}
    </CardHeader>
  );
}

// Content component with proper spacing
export function ThemedCardContent({ children, className }: ThemedCardContentProps) {
  return (
    <CardContent className={cn("space-y-4 sm:space-y-6", className)}>
      {children}
    </CardContent>
  );
} 