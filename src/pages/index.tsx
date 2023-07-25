import Balance from "~/components/Balance";
import Metahead from "~/components/Metahead";
import Movements from "~/components/Movements";
import type { FieldProps, FormikHelpers } from "formik";
import type { Movement } from "@prisma/client";
import { Field, Form, Formik } from "formik";
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
    const response = formValidation.safeParse(formValues);

    if (response.success) {
      return {};
    } else {
      const newErrors = response.error.issues.reduce(
        (obj, err) => ({
          ...obj,
          [err.path[0] as string]: err.message,
        }),
        {}
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
      <Metahead />

      <main className="relative mx-auto min-h-full bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 pt-4 text-white">
        <div className="container mx-auto flex flex-col">
          <div className="flex items-center justify-between">
            <Balance
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
                          disabled={!sessionData}
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
                          disabled={!sessionData}
                          placeholder="Whiskas"
                          required
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
                        disabled={!sessionData || isSubmitting || isValidating}
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
                        disabled={!sessionData || isSubmitting || isValidating}
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
        <footer className="absolute bottom-0 left-0 right-0">
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
