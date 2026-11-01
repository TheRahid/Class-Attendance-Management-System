import Brand from "./Brand.jsx";

export default function AuthFrame({ title, subtitle, children }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-900/5">
        <Brand centered />
        <h1 className="mt-8 text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
