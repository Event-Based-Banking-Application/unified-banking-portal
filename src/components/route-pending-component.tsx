import { Icon } from "./icons";

export function RoutePendingComponent() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Icon name="loader-2" className="size-6 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
