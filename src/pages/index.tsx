import Balance from "~/components/Balance";
import Header from "~/components/Header";
import Link from "next/link";
import Metahead from "~/components/Metahead";
import Movements from "~/components/Movements";
import type { Movement } from "@prisma/client";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import type { GetStaticProps } from "next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Home() {
  const { t } = useTranslation('common')
  const router = useRouter();
  const { data: sessionData } = useSession();

  const { data, refetch } = api.movement.get.useQuery(
    Number((router.query.page as unknown as string) || "0"),
    { enabled: !!sessionData?.user }
  );

  const { mutateAsync: deleteMovement } = api.movement.delete.useMutation();

  const handleDelete = async (movement: Movement) => {
    await deleteMovement(movement.id);
    void refetch();
  };

  return (
    <>
      <Metahead />
      <main className="relative mx-auto min-h-full bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 pb-12 pt-4 text-white">
        <div className="container mx-auto flex flex-col gap-4">
          <Header />

          <br />

          <Balance />

          <div className="flex flex-1 justify-center">
            <Link
              className="block max-w-[220px] rounded-full bg-white/10 px-6 py-4 text-center font-semibold text-white no-underline transition hover:bg-white/20"
              href="/new-movement"
            >
              {t('new-movement')}{" "}
              <span role="img" aria-label="plus">
                ➕
              </span>
            </Link>
          </div>

          <Movements
            data={data?.movements}
            handleDelete={handleDelete}
            hasNextPage={data?.hasNextPage}
          />
        </div>

        <footer className="absolute bottom-0 left-0 right-0 pb-4 pl-2">
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
// or getServerSideProps: GetServerSideProps<Props> = async ({ locale })
export const getStaticProps: GetStaticProps = async ({
  locale,
}) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'es', [
      'common',
    ])),
  },
})
