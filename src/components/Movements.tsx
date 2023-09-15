import Link from "next/link";
import invariant from "tiny-invariant";
import type { FunctionComponent } from "react";
import type { Movement } from "@prisma/client";
import { formatCurrency } from "~/utils/currency";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const Movements: FunctionComponent<{
  data: Movement[] | undefined;
  hasNextPage: boolean | undefined;
  handleDelete: (movement: Movement) => Promise<void>;
}> = ({ hasNextPage, handleDelete, data }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const pageQuery = router.query.page || "1";

  const getPageURL = (type: "inc" | "dec") => {
    try {
      invariant(typeof pageQuery === "string", "Page should be a string");

      const page = Number(pageQuery);
      invariant(!isNaN(page), "Page should be a number");

      const pageCalculated =
        type === "dec" ? Math.abs(page - 1 === 0 ? page : page - 1) : page + 1;

      return `/?page=${pageCalculated}`;
    } catch (error) {
      console.info(error);
      return "";
    }
  };

  const handleRemove = (movement: Movement) => {
    const response = confirm(t('delete-movement'));

    if (!response) {
      return;
    }

    void handleDelete(movement);
  };

  return (
    <section className="relative flex min-h-[520px] flex-col gap-2 pt-6">
      {data?.length || 0 > 0 ? (
        <>
          <h1 className="text-lg">Movements</h1>
          <div className="flex flex-col gap-3">
            {data?.map((movement) => {
              const amount = formatCurrency(movement.amount);

              return (
                <div
                  className="grid grid-cols-[1fr_80px_40px] gap-4 rounded bg-indigo-900 px-4 py-5"
                  key={movement.id}
                >
                  <p className="flex flex-col gap-1">
                    <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {movement.description}
                    </span>

                    <span className="overflow-hidden overflow-ellipsis whitespace-nowrap text-gray-400">
                      {movement.createdAt
                        ? movement.createdAt.toLocaleString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "numeric",
                          })
                        : ""}
                    </span>
                  </p>

                  <span className="flex items-center">{amount}</span>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(movement);
                    }}
                    className="rounded bg-red-800 px-2 text-center"
                  >
                    X
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mb-2 mt-4 grid grid-cols-2 gap-2">
            {pageQuery !== "1" ? (
              <Link className="flex" href={getPageURL("dec")}>
                <button className="flex-1 rounded-full bg-white/10 px-6 py-8 font-semibold text-white no-underline transition hover:bg-white/20">
                  {"< Prev"}{" "}
                </button>
              </Link>
            ) : (
              <span />
            )}

            {hasNextPage ? (
              <Link className="flex" href={getPageURL("inc")}>
                <button className="flex-1 rounded-full bg-white/10 px-6 py-4 font-semibold text-white no-underline transition hover:bg-white/20">
                  {"Next >"}
                </button>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </>
      ) : null}
    </section>
  );
};
export default Movements;
