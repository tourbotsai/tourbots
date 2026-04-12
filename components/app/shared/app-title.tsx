interface AppTitleProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AppTitle({ title, description, action }: AppTitleProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl text-text-primary-light dark:text-text-primary-dark">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark mt-2">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
} 