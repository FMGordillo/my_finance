import Balance from "~/components/Balance";
import Metahead from "~/components/Metahead";
import Movements from "~/components/Movements";
import type { Movement } from "@prisma/client";
import { api } from "~/utils/api";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { data: sessionData } = useSession();

  const { data, isRefetching, refetch } = api.movement.get.useQuery(
    Number((router.query.page as unknown as string) || "0"),
    { enabled: !!sessionData?.user }
  );

  const { isLoading: isDeleting, mutateAsync: deleteMovement } =
    api.movement.delete.useMutation();

  const handleDelete = async (movement: Movement) => {
    await deleteMovement(movement.id);
    void refetch();
  };

  return (
    <>
      <Metahead />
      <main className="relative mx-auto min-h-full bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 pb-12 pt-4 text-white">
        <div className="container mx-auto flex flex-col gap-4 pt-8">
          <Balance
            loading={isDeleting || isRefetching}
            amount={data?.balance}
          />

          <Link
            className="text-center flex-1 rounded-full bg-white/10 px-4 py-2 font-semibold text-white no-underline transition hover:bg-white/20"
            href="/new-movement"
          >
            New movement
          </Link>

          <Movements
            data={data?.movements}
            handleDelete={handleDelete}
            hasNextPage={data?.hasNextPage}
            loading={isDeleting || isRefetching}
          />
        </div>

        <footer className="absolute bottom-0 left-0 right-0">
          <a
            className="text-sm text-slate-400"
            href="https://www.flaticon.com/free-icons/money"
            title="money icons"
          >
            Money icons created by Freepik - Flaticon
          </a>
        </footer>
      </main>
    </>
  );
}
