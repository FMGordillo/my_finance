import type { Decimal } from "@prisma/client/runtime";
import type { FunctionComponent } from "react";
import { formatCurrency } from "~/utils/currency";

type BalanceProps = {
  amount: Decimal | null | undefined;
  loading: boolean;
};

const Balance: FunctionComponent<BalanceProps> = ({ loading, amount }) => {
  const parsedAmount = amount ? formatCurrency(amount) : "0";

  return (
    <h1 className="flex flex-col items-center gap-1">
      <>
        <p className="text-3xl">{loading ? "Loading..." : parsedAmount}</p>
        <p className="text-sm text-gray-300">Current balance</p>
      </>
    </h1>
  );
};

export default Balance;
