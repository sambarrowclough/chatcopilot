import { type inferAsyncReturnType } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import db from "@/utils/db";
import { getServerSession } from "next-auth";
import authOptions from "@/utils/authOptions";

/**
 * Replace this with an object if you want to pass things to createContextInner
 */
type CreateContextOptions = Record<string, never>;

/** Use this helper for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 **/
export const createContextInner = async (opts: CreateContextOptions) => {};

/**
 * This is the actual context you'll use in your router
 * @link https://trpc.io/docs/context
 **/
export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  async function getUserFromHeader() {
    const session = await getServerSession(req, res, authOptions);

    const user = await db.user.findUnique({
      where: {
        id: session?.user?.id,
      },
    });
    return user;
  }
  const user = await getUserFromHeader();
  return {
    user,
    prisma: db,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
