import { Fragment, FunctionComponent } from "react";
import type { Movement } from "@prisma/client";
import { useRouter } from "next/router";
import invariant from "tiny-invariant";
import Link from "next/link";
import { formatCurrency } from "~/utils/currency";

const Movements: FunctionComponent<{
  data: Movement[] | undefined;
  hasNextPage: boolean | undefined;
  handleDelete: (movement: Movement) => Promise<void>;
  loading: boolean;
}> = ({ hasNextPage, handleDelete, data, loading }) => {
  const router = useRouter();
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
    const response = confirm("Are you sure you want to delete this field?");

    if (!response) {
      return;
    }

    void handleDelete(movement);
  };

  return (
    <section className="relative pt-6">
      {loading ? (
        <span>Wait...</span>
      ) : (
        <div>
          <div className="grid grid-cols-[auto_1fr_1fr_24px] gap-2">
            <span>Date</span>
            <span>Amount</span>
            <span>Description</span>
            <span></span>
            {data?.map((movement) => {
              const amount = formatCurrency(movement.amount);
              const isNegative = amount[0] === "-";

              return (
                <Fragment key={movement.id}>
                  <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {movement.createdAt
                      ? movement.createdAt.toLocaleString("es-ES", {
                          weekday: 'short',
                          day: 'numeric',
                          month: "numeric",
                        })
                      : ""}
                  </span>
                  <span
                    className={`${
                      isNegative ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {amount}
                  </span>
                  <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {movement.description}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(movement);
                    }}
                    className="rounded bg-red-800 px-2 text-center"
                  >
                    X
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
      <div className="mb-2 mt-4 grid grid-cols-2 gap-2">
        {pageQuery !== "1" ? (
          <Link className="flex" href={getPageURL("dec")}>
            <button className="flex-1 rounded-full bg-white/10 px-4 py-2 font-semibold text-white no-underline transition hover:bg-white/20">
              {"< Prev"}{" "}
            </button>
          </Link>
        ) : (
          <span />
        )}
        {hasNextPage ? (
          <Link className="flex" href={getPageURL("inc")}>
            <button className="flex-1 rounded-full bg-white/10 px-4 py-2 font-semibold text-white no-underline transition hover:bg-white/20">
              {"Next >"}
            </button>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
};
export default Movements;
