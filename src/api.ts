import type { AppRouter } from '../server';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { createSWRProxyHooks } from "@trpc-swr/client";

const url = import.meta.env.VITE_API_URL as string;

if (!url) {
  throw new Error('Missing env VITE_API_URL');
}

const config = {
  links: [
    httpBatchLink({ url }),
  ],
}


export const swrApi = createSWRProxyHooks<AppRouter>(config);// for usage inside react components via useSWR hook
export const api = createTRPCProxyClient<AppRouter>(config); // for usage outside react components



