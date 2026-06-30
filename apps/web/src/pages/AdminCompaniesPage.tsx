import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import {
  getAdminCompany,
  listAdminCompanies,
  transitionAdminCompany,
  updateAdminCompany,
  type AdminCompany
} from "../adminCompanyClient";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

const actionsByStatus: Record<string, string[]> = {
  PENDING: ["approve", "reject"],
  ACTIVE: ["suspend"],
  SUSPENDED: ["approve", "reactivate"],
  REJECTED: ["approve", "reactivate"]
};

export function AdminCompaniesPage() {
  const { t } = useTranslation();
  const { companyId } = useParams();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [company, setCompany] = useState<AdminCompany | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    setMessage(null);
    if (companyId) {
      getAdminCompany(companyId)
        .then((result) => setCompany(result.company))
        .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminCompanies.loadFailed")));
      return;
    }

    listAdminCompanies()
      .then((result) => setCompanies(result.companies))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminCompanies.loadFailed")));
  }

  useEffect(() => {
    load();
  }, [companyId]);

  async function handleTransition(action: string) {
    if (!company) {
      return;
    }

    try {
      const adminNote = window.prompt(t("adminCompanies.adminNotePrompt")) ?? undefined;
      const result = await transitionAdminCompany(company.id, action, adminNote);
      setCompany(result.company);
      setMessage(t("adminCompanies.transitionSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminCompanies.transitionFailed"));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    try {
      const result = await updateAdminCompany(company.id, {
        publicName: text(formData.get("publicName")),
        legalName: text(formData.get("legalName")),
        phone: text(formData.get("phone")),
        email: text(formData.get("email")),
        website: text(formData.get("website")),
        city: text(formData.get("city")),
        address: text(formData.get("address")),
        taxId: text(formData.get("taxId")),
        contactPersonName: text(formData.get("contactPersonName")),
        contactPersonPhone: text(formData.get("contactPersonPhone")),
        contactPersonEmail: text(formData.get("contactPersonEmail")),
        description: text(formData.get("description"))
      });
      setCompany(result.company);
      setMessage(t("adminCompanies.saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminCompanies.saveFailed"));
    }
  }

  if (!companyId) {
    return (
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("adminCompanies.title")}</h1>
        <p className="mt-2 text-slate-600">{t("adminCompanies.description")}</p>
        {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
        <div className="mt-6 grid gap-3">
          {companies.map((item) => (
            <Link
              className="rounded border border-slate-200 bg-white p-4 transition hover:border-emerald-600"
              key={item.id}
              to={`/admin/companies/${item.id}`}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <p className="font-medium text-slate-950">{item.publicName}</p>
                <p className="text-sm text-slate-600">{t(`companyStatuses.${item.status}`)}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {t(`companyTypes.${item.type}`)} · {t("adminCompanies.members", { count: item._count?.members ?? 0 })} ·{" "}
                {t("adminCompanies.offers", { count: item._count?.vehicleOffers ?? 0 })}
              </p>
            </Link>
          ))}
          {!companies.length && !message ? <p className="text-slate-600">{t("adminCompanies.empty")}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl">
      <Link className="text-sm text-emerald-700" to="/admin/companies">
        {t("adminCompanies.backToList")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{company?.publicName ?? t("adminCompanies.title")}</h1>
      {message ? <p className="mt-6 text-sm text-slate-700">{message}</p> : null}
      {company ? (
        <div className="mt-6 grid gap-6">
          <div className="rounded border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{t(`companyStatuses.${company.status}`)}</p>
                <p className="text-sm text-slate-600">{t(`companyTypes.${company.type}`)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(actionsByStatus[company.status] ?? []).map((action) => (
                  <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" key={action} onClick={() => void handleTransition(action)} type="button">
                    {t(`adminCompanies.${action}`)}
                  </button>
                ))}
                {!(actionsByStatus[company.status] ?? []).length ? <p className="text-sm text-slate-600">{t("adminCompanies.noActions")}</p> : null}
              </div>
            </div>
          </div>

          <form className="grid gap-4 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["publicName", company.publicName],
                ["legalName", company.legalName],
                ["phone", company.phone],
                ["email", company.email],
                ["website", company.website],
                ["city", company.city],
                ["address", company.address],
                ["taxId", company.taxId],
                ["contactPersonName", company.contactPersonName],
                ["contactPersonPhone", company.contactPersonPhone],
                ["contactPersonEmail", company.contactPersonEmail]
              ] as Array<[string, string | null]>).map(([name, value]) => (
                <label className="grid gap-1 text-sm" key={name}>
                  {t(`companyProfile.${name}`)}
                  <input className="rounded border border-slate-300 px-3 py-2" defaultValue={value ?? ""} name={name} />
                </label>
              ))}
            </div>
            <label className="grid gap-1 text-sm">
              {t("companyProfile.description")}
              <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" defaultValue={company.description ?? ""} name="description" />
            </label>
            <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              {t("companyProfile.save")}
            </button>
          </form>

          <div className="rounded border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-950">{t("adminCompanies.membersTitle")}</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              {company.members?.map((member) => (
                <p key={member.id}>
                  {member.role} · {member.user.email ?? member.user.phone ?? member.user.id}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
