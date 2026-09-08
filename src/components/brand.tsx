export function Brand({
  size = "md",
  showWordmark = true,
}: {
  size?: "sm" | "md";
  showWordmark?: boolean;
}) {
  const box = size === "sm" ? "size-7" : "size-9";
  const text = size === "sm" ? "text-lg" : "text-[22px]";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid place-items-center bg-primary text-primary-foreground ${box}`}>
        <span className="font-display leading-none">V</span>
      </div>
      {showWordmark && (
        <div className="leading-none">
          <p className={`${text} font-display leading-none text-foreground`}>
            VANTAGE
          </p>
          <p className="eyebrow mt-1 text-muted-foreground">event banking</p>
        </div>
      )}
    </div>
  );
}
