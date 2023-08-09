import type { FunctionComponent } from "react";
import { api } from "~/utils/api";
import { formatCurrency } from "~/utils/currency";

const Balance: FunctionComponent = () => {
  const { isLoading, data } = api.movement.getBalance.useQuery();
  const parsedAmount = data ? formatCurrency(data?._sum.amount) : "0";

  return (
    <h1 className="flex flex-col items-center gap-2">
      <>
        <p className="text-5xl">{isLoading ? "Loading..." : parsedAmount}</p>
        <p className="text-md text-gray-300">Current balance</p>
      </>
    </h1>
  );
};

export default Balance;
