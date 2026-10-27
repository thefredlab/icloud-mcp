import { AsyncLocalStorage } from "async_hooks";

import type { User } from "../@types/database";

export const mcpContextStorage = new AsyncLocalStorage<{ pokeUserId: string; user: User }>();