import Metahead from "~/components/Metahead";
import type { FieldProps, FormikHelpers } from "formik";
import { Field, Form, Formik } from "formik";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useRouter } from "next/router";
import Header from "~/components/Header";

type FormValues = {
  type: string;
  amount: number | undefined;
  description: string;
};

const initialData: FormValues = {
  description: "",
  amount: undefined,
  type: "",
};

const formValidation = z
  .object({
    amount: z.number().positive().safe(),
    description: z.string(),
    type: z.string().min(1, "Select an option first"),
  })
  .required();

export default function NewMovementPage() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const { mutateAsync } = api.movement.create.useMutation();

  const handleFormSubmit = async (
    formValues: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    try {
      let amount = Number(formValues.amount);
      amount = formValues.type === "decrease" ? amount * -1 : amount;
      await mutateAsync({
        amount,
        description: formValues.description || "No description",
      });
      helpers.resetForm();
      void router.push("/");
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

  return (
    <>
      <Metahead title="New movement" />
      <main className="relative mx-auto flex h-full flex-col gap-4 bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 pb-12 pt-4 text-white">
        <Header />

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
            <Form className="grid h-full grid-cols-4 grid-rows-[auto_1fr_auto_auto] gap-4">
              <h1 className="col-span-4 text-3xl">New movement</h1>

              <br />

              <Field name="amount" placeholder="420" required>
                {({ field, meta }: FieldProps) => (
                  <label className="relative col-span-2 col-start-2">
                    <span className="absolute left-0">€</span>
                    <input
                      className="w-full border-b bg-transparent text-center text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none "
                      disabled={!sessionData}
                      placeholder="4.20"
                      required
                      type="number"
                      defaultValue=""
                      {...field}
                    />
                    {meta.touched && meta.error && (
                      <span className="block text-red-500">{meta.error}</span>
                    )}
                  </label>
                )}
              </Field>

              <Field name="description">
                {({ field, meta }: FieldProps) => (
                  <label className="col-span-4">
                    <input
                      className="w-full px-2 py-2 text-black"
                      disabled={!sessionData}
                      placeholder="Description (optional)"
                      type="string"
                      {...field}
                    />
                    {meta.touched && meta.error && (
                      <div className="text-red-500">{meta.error}</div>
                    )}
                  </label>
                )}
              </Field>

              {/* THIS IS DANGEROUS plz use the upper grid later FIXME */}
              <div className="col-span-4 grid grid-cols-[1fr_18px_1fr] grid-rows-2 items-center justify-center">
                <button
                  disabled={!sessionData || isSubmitting || isValidating}
                  className="col-span-1 col-start-1 select-none bg-emerald-600 px-2 py-2 disabled:bg-slate-500"
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
                  className="col-span-1 col-start-3 select-none bg-orange-500 px-2 py-2 disabled:bg-slate-500"
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

                {errors.type && (
                  <p className="col-span-3 row-start-2 place-self-center text-red-500">
                    {errors.type}
                  </p>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </main>
    </>
  );
}
