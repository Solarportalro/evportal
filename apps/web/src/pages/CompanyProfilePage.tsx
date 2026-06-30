import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCompanyProfile, updateCompanyProfile, type CompanyProfileResult } from "../companyProfileClient";
import { buttonStyles, ErrorMessage, FormSection, LoadingState, StatusBadge, SuccessMessage } from "../components/ui";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function CompanyProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<CompanyProfileResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
      setIsSuccess(true);
      setMessage(t("companyProfile.saved"));
    } catch (error) {
      setIsSuccess(false);
      setMessage(error instanceof Error ? error.message : t("companyProfile.saveFailed"));
    }
  }

  const company = profile?.company;
  const canEdit = profile?.memberRole === "COMPANY_ADMIN";

  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("companyProfile.title")}</h1>
      {company ? (
        <div className="mt-4 rounded border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={company.status === "ACTIVE" ? "emerald" : company.status === "REJECTED" || company.status === "SUSPENDED" ? "red" : "amber"}>
              {t(`companyStatuses.${company.status}`)}
            </StatusBadge>
            <span className="text-sm text-slate-600">{t(`companyTypes.${company.type}`)}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{t(`companyStatusMessages.${company.status}`)}</p>
        </div>
      ) : null}
      {message ? <div className="mt-6">{isSuccess ? <SuccessMessage>{message}</SuccessMessage> : <ErrorMessage>{message}</ErrorMessage>}</div> : null}
      {company ? (
        <form className="mt-6 grid gap-4 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
          <FormSection title={t("companyOnboarding.companyInformation")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["publicName", company.publicName],
                ["legalName", company.legalName],
                ["website", company.website],
                ["city", company.city],
                ["address", company.address]
              ] as Array<[string, string | null]>).map(([name, value]) => (
                <ProfileInput canEdit={canEdit} key={name} label={t(`companyProfile.${name}`)} name={name} value={value} />
              ))}
            </div>
            <label className="grid gap-1 text-sm">
              {t("companyProfile.description")}
              <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" defaultValue={company.description ?? ""} disabled={!canEdit} name="description" />
            </label>
          </FormSection>
          <FormSection title={t("companyOnboarding.contactDetails")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["phone", company.phone],
                ["email", company.email],
                ["contactPersonName", company.contactPersonName],
                ["contactPersonPhone", company.contactPersonPhone],
                ["contactPersonEmail", company.contactPersonEmail]
              ] as Array<[string, string | null]>).map(([name, value]) => (
                <ProfileInput canEdit={canEdit} key={name} label={t(`companyProfile.${name}`)} name={name} value={value} />
              ))}
            </div>
          </FormSection>
          {canEdit ? (
            <button className={`w-fit ${buttonStyles.primary}`} type="submit">
              {t("companyProfile.save")}
            </button>
          ) : (
            <p className="text-sm text-slate-600">{t("companyProfile.viewOnly")}</p>
          )}
        </form>
      ) : (
        <LoadingState>{t("companyProfile.loading")}</LoadingState>
      )}
    </section>
  );
}

function ProfileInput({ canEdit, label, name, value }: { canEdit: boolean; label: string; name: string; value: string | null }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input className="rounded border border-slate-300 px-3 py-2" defaultValue={value ?? ""} disabled={!canEdit} name={name} />
    </label>
  );
}
