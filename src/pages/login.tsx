import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loader, MessageCircle } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "http://localhost:3000",
    });

    setLoading(false);

    const { error, url, ok, status } = res as any;

    if (error) {
      toast.error(error);
      return;
    }

    if (url) {
      // if verify-request, show verify page.
      // url: http://localhost:3000/api/auth/verify-request?provider=email&type=email
      if (url.includes("verify-request")) {
        toast.error("We sent as login link to your email!");
        return;
      }

      router.push(url);
    }
  };

  return (
    <div className="h-screen max-w-xs mx-auto flex px-2">
      <div className="flex flex-col items-center justify-center w-full space-y-2">
        <div
          style={{
            background:
              "linear-gradient(to top, var(--gray2), var(--gray1) 16px)",
            padding: "16px",
            borderRadius: "50%",
            border: "1px solid #eee",
          }}
        >
          <MessageCircle color="#555fff" size={"56"} />
        </div>
        <h1 className="text-2xl text-neutral-900  ">Login to Chatcopilot</h1>
        <span className="flex text-sm text-neutral-400">
          A ChatGPT UI with a fresh coat of paint
        </span>
        <div className="mt-12"></div>
        <div className="mt-12"></div>
        <Input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          placeholder="Email"
          type="email"
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await handleLogin(e);
            }
          }}
        />

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={loading}
          style={{
            boxShadow:
              "rgba(0, 0, 0, 0.004) 0px 0.1px 0.1px 0px, rgba(0, 0, 0, 0.01) 0px 2px 2px 0px, rgba(0, 0, 0, 0.024) 0px 3px 3px 0px, rgba(0, 0, 0, 0.04) 0px 6px 6px 0px, rgba(0, 0, 0, 0.07) 0px 11px 11px 0px, rgba(0, 0, 0, 0.125) 0px 20px 20px 0px, rgba(0, 0, 0, 0.25) 0px 10px 70px 0px",
          }}
        >
          {loading && "Loading..."}
          {!loading && "Login"}
        </Button>
      </div>
    </div>
  );
}
