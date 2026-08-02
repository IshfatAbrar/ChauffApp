export default function FleetPageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-body text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-paper md:text-[36px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl font-body text-[15px] text-ash">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
