export default function Brand({
  inverse = false,
  centered = false,
  compact = false,
}) {
  return (
    <div className={`flex ${centered ? "justify-center" : ""}`}>
      <span
        className={`font-extrabold tracking-[-0.035em] ${inverse ? "text-white" : "text-slate-950"} ${compact ? "text-lg md:text-xl lg:text-2xl" : "text-3xl"}`}
      >
        Chronos<span className="text-emerald-500">.</span>
      </span>
    </div>
  );
}
