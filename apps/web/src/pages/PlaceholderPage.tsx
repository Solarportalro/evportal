type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="max-w-3xl">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-emerald-700">EV Portal by SolarPortal</p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-700">{description}</p>
    </section>
  );
}
