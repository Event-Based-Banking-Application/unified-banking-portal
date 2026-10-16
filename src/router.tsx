import { RoutePendingComponent } from "@/components/route-pending-component";
import { RouteErrorComponent } from "@/components/route-error-boundary";
import { toast } from "sonner";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const correlationId = Math.random().toString(36).substring(7);
      toast.error(error.message || "An unexpected error occurred", {
        description: `Correlation ID: ${correlationId}`,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const correlationId = Math.random().toString(36).substring(7);
      toast.error(error.message || "An unexpected error occurred", {
        description: `Correlation ID: ${correlationId}`,
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: true,
    },
    mutations: {
      throwOnError: true,
    },
  },
});

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    defaultPendingComponent: RoutePendingComponent,
    defaultErrorComponent: RouteErrorComponent,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
