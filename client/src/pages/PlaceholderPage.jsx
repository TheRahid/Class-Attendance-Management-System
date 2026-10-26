export default function PlaceholderPage({ title }) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        We’ll implement this page in the next stage.
      </p>
    </section>
  );
}