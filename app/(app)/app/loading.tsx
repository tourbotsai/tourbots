export default function AppSegmentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-72 rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
