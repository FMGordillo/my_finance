import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const { data: sessionData } = useSession();

  return (
    <header className="flex flex-row-reverse justify-between pt-4">
      <button
        className="max-w-[200px] self-end rounded-full bg-white/10 px-4 py-2 text-center font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() => void (sessionData ? signOut() : signIn())}
      >
        Sign {sessionData ? "out" : "in"}
      </button>

      {router.pathname !== "/" && (
        <button
          className="max-w-[200px] self-end rounded-full bg-white/10 px-4 py-2 text-center font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={() => router.back()}
        >
          <span role="img" aria-label="go-back">
            ←
          </span>
        </button>
      )}
    </header>
  );
}
