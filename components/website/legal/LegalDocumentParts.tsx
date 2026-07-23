import Link from "next/link";
import type { ReactNode } from "react";

export function LegalIntro({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: number | string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-5">
      <h3 className="mb-3 text-lg font-semibold text-white">
        <span className="mr-2 text-slate-400">{number}.</span>
        {title}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-slate-500">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalSubclauses({
  clauses,
}: {
  clauses: { id: string; content: ReactNode }[];
}) {
  return (
    <div className="space-y-3">
      {clauses.map((clause) => (
        <p key={clause.id}>
          <span className="mr-2 font-medium text-slate-200">{clause.id}</span>
          {clause.content}
        </p>
      ))}
    </div>
  );
}

export function LegalInfoGrid({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="overflow-hidden rounded-lg border border-slate-700/60 divide-y divide-slate-700/60">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {row.label}
          </dt>
          <dd className="text-sm text-slate-200">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: [string, string];
  rows: [ReactNode, ReactNode][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/60">
      <table className="w-full min-w-[20rem] text-left text-sm">
        <thead className="border-b border-slate-700/60 bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-200">{headers[0]}</th>
            <th className="px-4 py-3 font-semibold text-slate-200">{headers[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/60">
          {rows.map((row, index) => (
            <tr key={index} className="bg-slate-950/30">
              <td className="px-4 py-3 font-medium text-slate-200">{row[0]}</td>
              <td className="px-4 py-3 text-slate-300">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalInternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-white underline decoration-slate-500 underline-offset-2 transition-colors hover:decoration-white">
      {children}
    </Link>
  );
}

export function LegalExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white underline decoration-slate-500 underline-offset-2 transition-colors hover:decoration-white"
    >
      {children}
    </a>
  );
}

export function LegalMailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-white underline decoration-slate-500 underline-offset-2 transition-colors hover:decoration-white"
    >
      {email}
    </a>
  );
}
