import type { Decimal } from "@prisma/client/runtime";

export const formatCurrency = (amount: Decimal | null | undefined) =>
  Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount as unknown as number);
