import Head from "next/head";
import type { Decimal } from "@prisma/client/runtime";
import type { FieldProps, FormikHelpers } from "formik";
import type { FunctionComponent } from "react";
import { Field, Form, Formik } from "formik";
import type { Movement } from "@prisma/client";
import { api } from "~/utils/api";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { z } from "zod";
import { formatCurrency } from "~/utils/currency";
import Movements from "~/components/Movements";

type FormValues = { type: string; amount: number; description: string };

const initialData: FormValues = {
  description: "",
  amount: 0,
  type: "",
};

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

const formValidation = z
  .object({
    amount: z.number().positive().safe(),
    description: z.string(),
    type: z.string().min(1, "Select an option first"),
  })
  .required();

export default function Home() {
  const router = useRouter();
  const { data: sessionData } = useSession();

  const { data, isRefetching, refetch } = api.movement.get.useQuery(
    Number((router.query.page as unknown as string) || "0"),
    { enabled: !!sessionData?.user }
  );

  const { isLoading: isCreating, mutateAsync } =
    api.movement.create.useMutation();

  const { isLoading: isDeleting, mutateAsync: deleteMovement } =
    api.movement.delete.useMutation();

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
        <title>Financial Stuff</title>
        <meta
          name="description"
          content="Manage your financing with this app"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
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
                className="rounded-full bg-white/10 px-3 py-2 font-semibold text-white no-underline transition hover:bg-white/20"
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
                          <span className="absolute bottom-0 left-0 top-0 block py-2 pl-2 text-black">
                            $
                          </span>
                        </div>
                        <input
                          className="px-2 py-2 pl-5 text-black"
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
        <footer className="absolute left-0 right-0 bottom-0">
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
