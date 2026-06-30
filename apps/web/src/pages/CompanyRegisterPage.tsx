import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { registerCompany, saveTokens } from "../authClient";

const companyTypes = ["STOCK_SELLER", "IMPORTER", "OFFICIAL_DEALER", "BROKER", "MIXED"];

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function CompanyRegisterPage() {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(t("companyOnboarding.registrationPending"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("auth.failed"));
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("pages.companyRegister.title")}</h1>
      <p className="mt-2 text-slate-600">{t("pages.companyRegister.description")}</p>
      {message ? <p className="mt-6 rounded bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p> : null}
      <form className="mt-6 grid gap-4 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="rounded border border-slate-300 px-3 py-2" name="fullName" placeholder={t("auth.fullName")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="email" placeholder={t("auth.email")} required type="email" />
          <input className="rounded border border-slate-300 px-3 py-2" name="phone" placeholder={t("auth.phone")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="password" placeholder={t("auth.password")} required type="password" />
          <input className="rounded border border-slate-300 px-3 py-2" name="publicName" placeholder={t("companyProfile.publicName")} required />
          <input className="rounded border border-slate-300 px-3 py-2" name="legalName" placeholder={t("companyProfile.legalName")} />
          <select className="rounded border border-slate-300 px-3 py-2" name="type" required>
            {companyTypes.map((type) => (
              <option key={type} value={type}>
                {t(`companyTypes.${type}`)}
              </option>
            ))}
          </select>
          <input className="rounded border border-slate-300 px-3 py-2" name="companyPhone" placeholder={t("companyProfile.phone")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="website" placeholder={t("companyProfile.website")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="city" placeholder={t("companyProfile.city")} />
        </div>
        <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" name="description" placeholder={t("companyProfile.description")} />
        <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
          {t("companyOnboarding.register")}
        </button>
      </form>
    </section>
  );
}
