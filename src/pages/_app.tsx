import { AppProps, type AppType } from "next/app";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { trpc } from "../utils/trpc";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";

import "../styles/globals.css";
import { Session } from "next-auth";

function MyApp({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  return (
    <>
      <SessionProvider session={pageProps.session}>
        <ReactQueryDevtools />
        <Component {...pageProps} />
        <Toaster />
      </SessionProvider>
    </>
  );
}

export default trpc.withTRPC(MyApp);
