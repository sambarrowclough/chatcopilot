import jwt from "jsonwebtoken";
import sendEmail from "@/utils/sendEmail";
import { verifyEmail } from "@/utils/emails";
import EmailProvider from "next-auth/providers/email";
import { NextAuthOptions, Session } from "next-auth";
import db from "@/utils/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers
  providers: [
    EmailProvider({
      async sendVerificationRequest(params) {
        const { identifier, url, provider, theme } = params;
        const { host } = new URL(url);
        const { error } = await sendEmail({
          to: identifier,
          from: process.env.FROM_EMAIL!,
          subject: `Sign in to ${host}`,
          messageStream: "outbound",
          html: verifyEmail({ href: url }),
        });

        if (error) {
          console.error(error);
          throw new Error("SEND_VERIFICATION_EMAIL_ERROR");
        }
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    async session({ session, user, token }) {
      const newSession = session as Session;
      newSession.user.id = token.sub!;
      const signingSecret = process.env.SUPABASE_JWT_SECRET;

      /**
       * If supabase secret is set, create a JWT for the user
       *
       * Just incase we want to enable RLS later on
       */
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub,
          email: user.email,
          role: "authenticated",
        };

        newSession.supabaseAccessToken = jwt.sign(payload, signingSecret);
      }

      return newSession as Session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

export default authOptions;
