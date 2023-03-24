import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
} from "openai";

import { z } from "zod";
import { router, publicProcedure } from "../trpc";

const createPrefixId = (prefix: string) => {
  return `${prefix}_${createId()}`;
};

export const messagesRouter = router({
  list: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.message.findMany({
        where: {
          conversationId: input?.conversationId!,
        },

        orderBy: {
          createdAt: "asc",
        },
      });
    }),
  create: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
        parentId: z.string().nullish(),
        conversationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const message = await ctx.prisma.message.create({
        data: {
          id: createPrefixId("msg"),
          text: input?.prompt,
          conversationId: input?.conversationId,
          parentId: input?.parentId,
          role: "user",
        },
      });

      /**
       * Get all messages in the conversation
       */
      const messages = await ctx.prisma.message.findMany({
        where: {
          conversationId: input?.conversationId!,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 10,
      });

      const mappedMessages = messages.map((message) => {
        return {
          role:
            message.role === "user"
              ? ChatCompletionRequestMessageRoleEnum.User
              : ChatCompletionRequestMessageRoleEnum.Assistant,
          content: message.text as ChatCompletionRequestMessage["content"],
        };
      });

      let apiKey = await ctx.prisma.apiKey.findFirst({
        where: {
          type: "openAi",
        },
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No OpenAi API key",
        });
      }

      const configuration = new Configuration({
        apiKey: apiKey.apiKey,
      });
      const openai = new OpenAIApi(configuration);

      let completion;
      try {
        completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant.",
            },
            ...mappedMessages,
            { role: "user", content: input?.prompt },
          ],
        });
      } catch (error) {
        const openAiError = (error as any).response.data.error as {
          message: string;
          code: string;
        };

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: openAiError.message,
        });
      }

      const id = completion.data.id;
      const msg = completion?.data?.choices?.[0]?.message;

      await ctx.prisma.message.create({
        data: {
          id: createPrefixId("msg"),
          text: msg?.content,
          conversationId: input?.conversationId,
          parentId: id,
          role: "assistant",
        },
      });

      return {
        message,
        parentId: id,
      };
    }),
});
