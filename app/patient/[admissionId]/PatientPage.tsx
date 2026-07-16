import { cn } from "@/src/lib/utils";

/** Shared heading for the bedside sub-screens, so they all sit on the same grid. */
export function BedsideHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function BedsideCard({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("card p-6", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="eyebrow">{title}</p>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function BedsideEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm font-medium text-ink-mute">
      {children}
    </p>
  );
}

export function BedsideLoading() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-sheen rounded-2xl bg-white" />
      <div className="h-56 animate-sheen rounded-2xl bg-white" />
    </div>
  );
}
