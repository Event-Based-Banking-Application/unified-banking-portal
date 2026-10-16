import { Icon } from "./icons";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function RouteErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex h-[50vh] w-full items-center justify-center p-6">
      <div className="mx-auto flex max-w-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <Icon name="alert-circle" className="size-6 text-destructive" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            variant="default"
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
