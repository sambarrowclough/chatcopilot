import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { createPrefixId } from "@/utils";

export const apiKeysRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.apiKey.findMany({
      where: {
        userId: ctx?.user?.id!,
      },
    });
  }),
  create: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        type: z.enum(["openAi", "chatcopilot"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.apiKey.create({
        data: {
          id: createPrefixId("api"),
          apiKey: input?.apiKey!,
          type: input?.type!,
          userId: ctx?.user?.id!,
        },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        apiKey: z.string().nullish(),
        type: z.enum(["openAi", "chatcopilot"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.apiKey.update({
        where: {
          id: input.id,
        },

        data: {
          apiKey: input?.apiKey!,
          type: input?.type!,
          userId: ctx?.user?.id!,
        },
      });
    }),
});
