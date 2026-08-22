/* Instrument frame. Only the two readouts wear it, the timeline and the
   request stream, so the page reads as a control room without turning every
   block into a card. */
export default function Panel({
  label,
  icon,
  meta,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-ink-100/8 bg-ink-900/60">
      <header className="flex items-center gap-2 border-b border-ink-100/8 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        {icon}
        {label}
        {meta && (
          <span className="ml-auto font-data normal-case tracking-normal">
            {meta}
          </span>
        )}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
