import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCompanyProfile, updateCompanyProfile, type CompanyProfileResult } from "../companyProfileClient";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function CompanyProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<CompanyProfileResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function loadProfile() {
    getCompanyProfile()
      .then(setProfile)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("companyProfile.loadFailed")));
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const result = await updateCompanyProfile({
        publicName: text(formData.get("publicName")),
        legalName: text(formData.get("legalName")),
        phone: text(formData.get("phone")),
        email: text(formData.get("email")),
        website: text(formData.get("website")),
        city: text(formData.get("city")),
        address: text(formData.get("address")),
        description: text(formData.get("description")),
        contactPersonName: text(formData.get("contactPersonName")),
        contactPersonPhone: text(formData.get("contactPersonPhone")),
        contactPersonEmail: text(formData.get("contactPersonEmail"))
      });
      setProfile(result);
      setMessage(t("companyProfile.saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("companyProfile.saveFailed"));
    }
  }

  const company = profile?.company;
  const canEdit = profile?.memberRole === "COMPANY_ADMIN";

  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("companyProfile.title")}</h1>
      {company ? (
        <p className="mt-3 rounded bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {t(`companyStatusMessages.${company.status}`)}
        </p>
      ) : null}
      {message ? <p className="mt-6 text-sm text-slate-700">{message}</p> : null}
      {company ? (
        <form className="mt-6 grid gap-4 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="flex flex-wrap justify-between gap-3">
            <p className="font-medium text-slate-950">{t(`companyStatuses.${company.status}`)}</p>
            <p className="text-sm text-slate-600">{t(`companyTypes.${company.type}`)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["publicName", company.publicName],
              ["legalName", company.legalName],
              ["phone", company.phone],
              ["email", company.email],
              ["website", company.website],
              ["city", company.city],
              ["address", company.address],
              ["contactPersonName", company.contactPersonName],
              ["contactPersonPhone", company.contactPersonPhone],
              ["contactPersonEmail", company.contactPersonEmail]
            ] as Array<[string, string | null]>).map(([name, value]) => (
              <label className="grid gap-1 text-sm" key={name}>
                {t(`companyProfile.${name}`)}
                <input className="rounded border border-slate-300 px-3 py-2" defaultValue={value ?? ""} disabled={!canEdit} name={name} />
              </label>
            ))}
          </div>
          <label className="grid gap-1 text-sm">
            {t("companyProfile.description")}
            <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" defaultValue={company.description ?? ""} disabled={!canEdit} name="description" />
          </label>
          {canEdit ? (
            <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              {t("companyProfile.save")}
            </button>
          ) : (
            <p className="text-sm text-slate-600">{t("companyProfile.viewOnly")}</p>
          )}
        </form>
      ) : null}
    </section>
  );
}
