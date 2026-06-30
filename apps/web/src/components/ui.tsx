import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded border border-slate-200 bg-slate-50 p-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</p>;
}

export function SuccessMessage({ children }: { children: ReactNode }) {
  return <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{children}</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">{children}</p>;
}

export function LoadingState({ children }: { children: ReactNode }) {
  return <p className="rounded bg-slate-100 px-4 py-3 text-sm text-slate-600">{children}</p>;
}

export function StatusBadge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "emerald" | "amber" | "red" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700"
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export const buttonStyles = {
  primary: "rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800",
  secondary: "rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200",
  dark: "rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
};
