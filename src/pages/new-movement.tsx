import Header from "~/components/Header";
import Metahead from "~/components/Metahead";
import type {
  FieldErrors,
  Message,
  MultipleFieldErrors,
  SubmitHandler,
  UseFormRegisterReturn,
} from "react-hook-form";
import { get, useFormContext } from "react-hook-form";
import {
  ComponentType,
  FunctionComponent,
  ReactElement,
  ReactNode,
} from "react";
import { Fragment, cloneElement, createElement, isValidElement } from "react";
import { api } from "~/utils/api";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useTranslation } from "next-i18next";

const initialData: FormValues = {
  description: "",
  amount: undefined,
  type: "",
};

const getFormValidation = (t: any) =>
  z
    .object({
      amount: z
        .number()
        .positive()
        .safe()
        .finite()
        .or(z.string())
        .pipe(z.coerce.number()),
      description: z.string(),
      type: z.string().min(1, t("movement-form.no-type")),
    })
    .required();

type ErrorMessageProps = {
  as?:
    | undefined
    | ReactElement
    | ComponentType<any>
    | keyof JSX.IntrinsicElements;
  errors?: FieldErrors;
  message?: Message;
  name: string;
  render?: (data: {
    message: Message;
    messages?: MultipleFieldErrors;
  }) => ReactNode;
};

type Error = {
  message: Message;
  types?: MultipleFieldErrors;
};

const ErrorMessage: FunctionComponent<ErrorMessageProps> = ({
  as,
  errors,
  message,
  render,
  name,
  ...rest
}) => {
  const methods = useFormContext();
  const error = get(errors || methods.formState.errors, name) as Error;

  if (!error) {
    return null;
  }

  const { message: messageFromRegister, types } = error;

  const props = Object.assign({}, rest, {
    children: messageFromRegister || message,
  });

  return isValidElement(as)
    ? cloneElement(as, props)
    : render
    ? (render({
        message: messageFromRegister || message || "",
        messages: types,
      }) as ReactElement)
    : createElement((as as string) || Fragment, props);
};

type FormValues = {
  type: string;
  amount: number | undefined;
  description: string;
};

const useNewMovement = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { mutateAsync } = api.movement.create.useMutation();
  const { setValue, register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: initialData,
  });

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      let amount = Number(data.amount);
      amount = data.type === "decrease" ? amount * -1 : amount;
      await mutateAsync({
        amount,
        description: data.description || "No description",
      });
      void router.push("/");
    } catch (error) {
      console.error("error while sending expense", error);
    }
  };

  const validator = (value: unknown, fieldName: keyof FormValues) => {
    const validationResult =
      getFormValidation(t).shape[fieldName].safeParse(value);

    if (!validationResult.success) {
      return validationResult.error.message;
    } else {
      return undefined;
    }
  };

  const fields: Record<keyof FormValues, UseFormRegisterReturn> = {
    amount: register("amount", {
      required: true,
      min: {
        value: 0,
        message: t("movement-form.no-negative-amount"),
      },
      validate: (value) => validator(value, "amount"),
    }),
    description: register("description", {
      validate: (value) => validator(value, "description"),
    }),
    type: register("type", {
      required: true,
    }),
  } as const;

  return {
    errors: formState.errors,
    fields,
    handleSubmit: handleSubmit(handleFormSubmit),
    isSubmitting: formState.isSubmitting,
    setValue,
  };
};

export default function NewMovementPage() {
  const { t } = useTranslation();
  const { data: sessionData } = useSession();
  const { isSubmitting, handleSubmit, setValue, errors, fields } =
    useNewMovement();

  return (
    <>
      <Metahead title={t("new-movement")} />
      <main className="relative mx-auto flex h-full flex-col gap-4 bg-gradient-to-b from-[#2e026d] to-[#15162c] px-6 pt-4 text-white">
        <div className="container mx-auto flex h-full flex-col md:w-6/12">
          <Header />

          <br />

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="grid h-full flex-1 grid-cols-4 grid-rows-[auto_1fr_auto_auto_auto] gap-4"
          >
            <h1 className="col-span-4 text-3xl">{t("new-movement")}</h1>

            <br />

            <label className="relative col-span-2 col-start-2 flex h-1/2 flex-col justify-end">
              <span className="absolute left-0 text-2xl">€</span>
              <input
                {...fields.amount}
                autoFocus
                className="w-full border-b bg-transparent text-center text-2xl text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none "
                placeholder="4.20"
                defaultValue=""
              />
              <ErrorMessage
                errors={errors}
                name="amount"
                render={({ message }) => (
                  <span className="block text-red-500">{message}</span>
                )}
              />
            </label>

            <label className="col-span-4">
              <input
                {...fields.description}
                className="w-full px-2 py-2 text-black"
                placeholder={t("movement-form.description")}
                type="string"
              />
              <ErrorMessage
                errors={errors}
                name="description"
                render={({ message }) => (
                  <span className="block text-red-500">{message}</span>
                )}
              />
            </label>

            {/* THIS IS DANGEROUS plz use the upper grid later FIXME */}
            <div className="col-span-4 grid grid-cols-[1fr_18px_1fr] grid-rows-2 items-center justify-center">
              <button
                disabled={!sessionData || isSubmitting}
                className="col-span-1 col-start-1 select-none bg-emerald-600 px-2 py-2 disabled:bg-slate-500"
                onClick={(e) => {
                  e.preventDefault();
                  setValue("type", "increase");
                  void handleSubmit();
                }}
              >
                {t("movement-form.add")}
              </button>

              <button
                disabled={!sessionData || isSubmitting}
                className="col-span-1 col-start-3 select-none bg-orange-500 px-2 py-2 disabled:bg-slate-500"
                onClick={(e) => {
                  e.preventDefault();
                  setValue("type", "decrease");
                  void handleSubmit();
                }}
              >
                {t("movement-form.remove")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
