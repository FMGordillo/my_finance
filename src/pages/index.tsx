import Head from "next/head";
import Link from "next/link";
import invariant from "tiny-invariant";
import type { Decimal } from "@prisma/client/runtime";
import type { FieldProps, FormikHelpers } from "formik";
import type { FunctionComponent } from "react";
import { Field, Form, Formik } from "formik";
import { Movement } from "@prisma/client";
import { api } from "~/utils/api";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { z } from "zod";

type FormValues = { type: string; amount: number; description: string };

const initialData: FormValues = {
  description: "",
  amount: 0,
  type: "",
};

const formatCurrency = (amount: Decimal) =>
  Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount as unknown as number);

const CurrentBalance: FunctionComponent<{
  amount: Decimal | null | undefined;
  loading: boolean;
}> = ({ loading, amount }) => {
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

const Movements: FunctionComponent<{
  data: Movement[] | undefined;
  loading: boolean;
}> = ({ data, loading }) => {
  const router = useRouter();

  const getPageURL = (type: "inc" | "dec") => {
    try {
      const pageQuery = router.query.page || "1";
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

  return (
    <section className="flex h-72 gap-4">
      <Link href={getPageURL("dec")}>{"<"}</Link>
      {loading ? (
        <span>Wait...</span>
      ) : (
        <table>
          <thead>
            <tr className="grid grid-cols-3 gap-2">
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((movement) => {
              const amount = formatCurrency(movement.amount);
              const isNegative = amount[0] === "-";

              return (
                <tr key={movement.id} className="grid grid-cols-3 gap-4">
                  <td>
                    {movement.createdAt
                      ? movement.createdAt.toLocaleString()
                      : ""}
                  </td>
                  <td
                    className={`${isNegative ? "text-red-600" : "text-green-600"}`}
                  >
                    {amount}
                  </td>
                  <td>{movement.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Link href={getPageURL("inc")}>{">"}</Link>
    </section>
  );
};

const formValidation = z
  .object({
    amount: z.number().positive().safe(),
    description: z.string(),
    type: z.string().min(1, "Select an option first"),
  })
  .required();

export default function Home() {
  const router = useRouter();
  const {
    data: amountData,
    isRefetching: amountLoading,
    refetch: refetchAmount,
  } = api.movement.getBalance.useQuery();

  const {
    data: movementData,
    isRefetching: movementLoading,
    refetch: refetchMovement,
  } = api.movement.get.useQuery(
    Number((router.query.page as unknown as string) || "0")
  );

  const { isLoading, mutateAsync } = api.movement.create.useMutation();
  const { data: sessionData } = useSession();

  const handleFormSubmit = async (
    formValues: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    try {
      let amount = Number(formValues.amount);
      amount = formValues.type === "decrease" ? amount * -1 : amount;
      await mutateAsync({ amount, description: formValues.description });

      void refetchAmount();
      void refetchMovement();

      helpers.resetForm();
    } catch (error) {
      console.error("error while sending expense", error);
    }
  };

  const handleValidation = (formValues: FormValues) => {
    const errors: Record<keyof FormValues, string | undefined> = {
      amount: undefined,
      description: undefined,
      type: undefined,
    };

    const response = formValidation.safeParse(formValues);
    if (response.success) {
      return {};
    } else {
      const newErrors = response.error.issues.reduce(
        (obj, err) => ({
          ...obj,
          [err.path[0] as string]: err.message,
        }),
        errors
      );
      return newErrors;
    }
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="relative mx-auto min-h-full bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 text-white">
        <div className="container mx-auto flex flex-col">
          <div className="flex items-center justify-between">
            <CurrentBalance
              loading={isLoading || amountLoading}
              amount={amountData?._sum.amount}
            />

            <header className="flex justify-end">
              <button
                className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white no-underline transition hover:bg-white/20"
                onClick={
                  sessionData ? () => void signOut() : () => void signIn()
                }
              >
                {sessionData ? "Sign out" : "Sign in"}
              </button>
            </header>
          </div>

          <Movements loading={movementLoading} data={movementData} />

          <hr />

          <Formik
            validate={handleValidation}
            initialValues={initialData}
            onSubmit={(values, props) => handleFormSubmit(values, props)}
          >
            {({
              errors,
              handleSubmit,
              isSubmitting,
              isValidating,
              setValues,
            }) => (
              <div className="mt-4">
                <Form className="flex flex-col gap-4">
                  <Field name="amount" placeholder="420" required>
                    {({ field, meta }: FieldProps) => (
                      <label>
                        <span>Amount</span>
                        <div className="relative">
                          <span className="absolute left-0 pl-1 text-black">
                            $
                          </span>
                        </div>
                        <input
                          className="pl-4 pr-2 text-black"
                          required
                          type="number"
                          {...field}
                        />
                        {meta.touched && meta.error && (
                          <div className="text-red-500">{meta.error}</div>
                        )}
                      </label>
                    )}
                  </Field>

                  <Field name="description">
                    {({ field, meta }: FieldProps) => (
                      <label className="flex flex-col items-start">
                        <span>Description</span>
                        <input
                          className="px-2 py-2 text-black"
                          required
                          placeholder="Whiskas"
                          type="string"
                          {...field}
                        />
                        {meta.touched && meta.error && (
                          <div className="text-red-500">{meta.error}</div>
                        )}
                      </label>
                    )}
                  </Field>

                  <div className="flex flex-col">
                    <div className="flex gap-4">
                      <button
                        disabled={isSubmitting || isValidating}
                        className="select-none bg-emerald-600 px-2 py-2 disabled:bg-slate-500"
                        onClick={() => {
                          setValues((formData) => ({
                            ...formData,
                            type: "increase",
                          }));
                          handleSubmit();
                        }}
                      >
                        Add +
                      </button>

                      <button
                        disabled={isSubmitting || isValidating}
                        className="select-none bg-orange-500 px-2 py-2 disabled:bg-slate-500"
                        onClick={() => {
                          setValues((formData) => ({
                            ...formData,
                            type: "decrease",
                          }));
                          handleSubmit();
                        }}
                      >
                        Remove -
                      </button>
                    </div>
                    {errors.type && (
                      <span className="text-red-500">{errors.type}</span>
                    )}
                  </div>
                </Form>
              </div>
            )}
          </Formik>
        </div>
      </main>
    </>
  );
}
