export function Brand({
  size = "md",
  showWordmark = true,
}: {
  size?: "sm" | "md";
  showWordmark?: boolean;
}) {
  const box = size === "sm" ? "size-7 rounded-md" : "size-9 rounded-lg";
  const text = size === "sm" ? "text-sm" : "text-[15px]";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid place-items-center bg-primary text-primary-foreground ring-1 ring-primary/40 ${box}`}>
        <span className="font-mono font-semibold leading-none">V</span>
      </div>
      {showWordmark && (
        <div className="leading-none">
          <p className={`${text} font-semibold tracking-tight text-foreground`}>
            Vantage
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            event banking
          </p>
        </div>
      )}
    </div>
  );
}
