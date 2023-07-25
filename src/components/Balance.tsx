import type { Decimal } from "@prisma/client/runtime";
import type { FunctionComponent } from "react";
import { formatCurrency } from "~/utils/currency";

type BalanceProps = {
  amount: Decimal | null | undefined;
  loading: boolean;
};

const Balance: FunctionComponent<BalanceProps> = ({ loading, amount }) => {
  const parsedAmount = amount ? formatCurrency(amount) : "0";

  return amount ? (
    <h1 className="flex gap-2 text-2xl">
      {loading ? (
        <span>Recalculating...</span>
      ) : (
        <>
          <span className="hidden sm:inline">Current balance</span>
          <span className="inline sm:hidden">Balance</span>
          <span>{parsedAmount}</span>
        </>
      )}
    </h1>
  ) : null;
};

export default Balance;
