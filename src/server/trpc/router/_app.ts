import { router } from "../trpc";
import { conversationsRouter } from "./conversations";
import { messagesRouter } from "./messages";
import { apiKeysRouter } from "./apiKeys";
import { notesRouter } from "./notes";

export const appRouter = router({
  conversations: conversationsRouter,
  messages: messagesRouter,
  apiKeys: apiKeysRouter,
  notes: notesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
