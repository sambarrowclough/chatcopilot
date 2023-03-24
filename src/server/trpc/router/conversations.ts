import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { createPrefixId } from "@/utils";

export const conversationsRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const conversation = await ctx.prisma.conversation.findUnique({
      where: {
        id: input,
      },
    });

    return conversation;
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.prisma.conversation.findMany({
      where: {
        userId: ctx?.user?.id!,
      },

      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        userId: true,

        messages: {
          take: 1,

          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
    return conversations;
  }),
  update: publicProcedure
    .input(
      z
        .object({
          name: z.string().nullish(),
          note: z.string().nullish(),
          id: z.string().nullish(),
        })
        .nullish()
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.conversation.update({
        where: {
          id: input?.id!,
        },

        data: {
          name: input?.name,
          userId: ctx?.user?.id!,
          note: input?.note!,
        },
      });
    }),
  create: publicProcedure
    .input(
      z
        .object({
          name: z.string().nullish(),
          id: z.string().nullish(),
        })
        .nullish()
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.conversation.create({
        data: {
          id: input?.id || createPrefixId("cnv"),
          name: input?.name,
          userId: ctx?.user?.id!,
        },
      });
    }),
  delete: publicProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    console.log(input);
    return ctx.prisma.conversation.delete({
      where: {
        id: input,
      },

      include: {
        messages: true,
      },
    });
  }),
});
