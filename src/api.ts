import type { AppRouter } from '../server';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { createSWRProxyHooks } from "@trpc-swr/client";

const config = {
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
}


export const swrApi = createSWRProxyHooks<AppRouter>(config);// for usage inside react components via useSWR hook
export const api = createTRPCProxyClient<AppRouter>(config); // for usage outside react components



