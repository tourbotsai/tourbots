import type { ReactNode } from "react";

interface AppTitleProps {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}

export function AppTitle({ title, description, action }: AppTitleProps) {
  return (
    <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 hidden text-sm leading-relaxed text-gray-500 dark:text-gray-400 md:block">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="ml-4 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
} 