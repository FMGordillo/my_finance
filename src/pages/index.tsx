import Head from "next/head";
import Link from "next/link";
import invariant from "tiny-invariant";
import type { Decimal } from "@prisma/client/runtime";
import type { FieldProps, FormikHelpers } from "formik";
import { Fragment, FunctionComponent } from "react";
import { Field, Form, Formik } from "formik";
import type { Movement } from "@prisma/client";
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
                          dateStyle: "short",
                          timeStyle: "short",
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

const formValidation = z
  .object({
    amount: z.number().positive().safe(),
    description: z.string(),
    type: z.string().min(1, "Select an option first"),
  })
  .required();

export default function Home() {
  const router = useRouter();

  const { data, isRefetching, refetch } = api.movement.get.useQuery(
    Number((router.query.page as unknown as string) || "0")
  );

  const { isLoading: isCreating, mutateAsync } =
    api.movement.create.useMutation();

  const { isLoading: isDeleting, mutateAsync: deleteMovement } =
    api.movement.delete.useMutation();

  const { data: sessionData } = useSession();

  const handleFormSubmit = async (
    formValues: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    try {
      let amount = Number(formValues.amount);
      amount = formValues.type === "decrease" ? amount * -1 : amount;
      await mutateAsync({ amount, description: formValues.description });

      void refetch();

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

  const handleDelete = async (movement: Movement) => {
    await deleteMovement(movement.id);
    void refetch();
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="relative mx-auto min-h-full bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 pt-4 text-white">
        <div className="container mx-auto flex flex-col">
          <div className="flex items-center justify-between">
            <CurrentBalance
              loading={isDeleting || isCreating || isRefetching}
              amount={data?.balance}
            />

            <header className="flex justify-end">
              <button
                className="rounded-full bg-white/10 px-2 py-2 font-semibold text-white no-underline transition hover:bg-white/20"
                onClick={
                  sessionData ? () => void signOut() : () => void signIn()
                }
              >
                {sessionData ? "Sign out" : "Sign in"}
              </button>
            </header>
          </div>

          <Movements
            data={data?.movements}
            handleDelete={handleDelete}
            hasNextPage={data?.hasNextPage}
            loading={isDeleting || isRefetching}
          />

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
