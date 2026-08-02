/** @deprecated Prefer FleetPageHeader for fleet console pages */
export default function FleetSubpageHero({ title, description }) {
  return (
    <section className="px-6 pt-8 pb-2 md:px-8 md:pt-10">
      <h1 className="max-w-3xl font-body text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-paper md:text-[36px]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl font-body text-[15px] text-ash">
          {description}
        </p>
      )}
    </section>
  );
}
