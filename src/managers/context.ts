import { AsyncLocalStorage } from "async_hooks";

export const mcpContextStorage = new AsyncLocalStorage<{ pokeUserId: string }>();