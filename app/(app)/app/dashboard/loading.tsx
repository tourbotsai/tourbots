export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
