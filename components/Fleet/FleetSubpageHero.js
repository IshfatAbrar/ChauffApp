/** Hero block aligned with /fleet marketing page (pill, gradient title, muted copy). */
export default function FleetSubpageHero({ eyebrow, title, description }) {
  return (
    <section className="max-w-3xl mx-auto px-4 pb-10 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 shadow-sm mb-6">
        {eyebrow}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.15] mb-4 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500 bg-clip-text text-transparent">
        {title}
      </h1>
      {description && (
        <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
          {description}
        </p>
      )}
    </section>
  );
}
