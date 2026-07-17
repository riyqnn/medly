import { cn } from "@/src/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("animate-fade-up p-8", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="text-sm font-bold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-mute">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Centred spinner used while a panel's data is in flight. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-6 py-14 text-sm font-medium text-ink-mute">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand-500" />
      {label}
    </div>
  );
}
