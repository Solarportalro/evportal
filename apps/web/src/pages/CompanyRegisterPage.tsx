import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { registerCompany, saveTokens } from "../authClient";
import { buttonStyles, ErrorMessage, FormSection, SuccessMessage } from "../components/ui";

const companyTypes = ["STOCK_SELLER", "IMPORTER", "OFFICIAL_DEALER", "BROKER", "MIXED"];

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function CompanyRegisterPage() {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const result = await registerCompany({
        fullName: text(formData.get("fullName")),
        email: text(formData.get("email")),
        phone: text(formData.get("phone")),
        password: text(formData.get("password")),
        company: {
          publicName: text(formData.get("publicName")),
          legalName: text(formData.get("legalName")),
          type: text(formData.get("type")),
          phone: text(formData.get("companyPhone")),
          website: text(formData.get("website")),
          city: text(formData.get("city")),
          description: text(formData.get("description"))
        }
      });
      saveTokens(result.tokens);
      setIsSuccess(true);
      setMessage(t("companyOnboarding.registrationPending"));
    } catch (error) {
      setIsSuccess(false);
      setMessage(error instanceof Error ? error.message : t("auth.failed"));
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("pages.companyRegister.title")}</h1>
      <p className="mt-2 text-slate-600">{t("pages.companyRegister.description")}</p>
      {message ? <div className="mt-6">{isSuccess ? <SuccessMessage>{message}</SuccessMessage> : <ErrorMessage>{message}</ErrorMessage>}</div> : null}
      <form className="mt-6 grid gap-5 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
        <FormSection title={t("companyOnboarding.accountOwner")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label={t("auth.fullName")} name="fullName" />
            <InputField label={t("auth.email")} name="email" required type="email" />
            <InputField label={t("auth.phone")} name="phone" />
            <InputField label={t("auth.password")} name="password" required type="password" />
          </div>
        </FormSection>
        <FormSection title={t("companyOnboarding.companyInformation")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label={t("companyProfile.publicName")} name="publicName" required />
            <InputField label={t("companyProfile.legalName")} name="legalName" />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("companyProfile.type")}
              <select className="rounded border border-slate-300 px-3 py-2" name="type" required>
                {companyTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`companyTypes.${type}`)}
                  </option>
                ))}
              </select>
            </label>
            <InputField label={t("companyProfile.website")} name="website" />
            <InputField label={t("companyProfile.city")} name="city" />
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("companyProfile.description")}
            <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" name="description" />
          </label>
        </FormSection>
        <FormSection title={t("companyOnboarding.contactDetails")}>
          <InputField label={t("companyProfile.phone")} name="companyPhone" />
        </FormSection>
        <button className={`w-fit ${buttonStyles.primary}`} type="submit">
          {t("companyOnboarding.register")}
        </button>
      </form>
    </section>
  );
}

function InputField(props: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      {props.required ? " *" : ""}
      <input className="rounded border border-slate-300 px-3 py-2" name={props.name} required={props.required} type={props.type ?? "text"} />
    </label>
  );
}
