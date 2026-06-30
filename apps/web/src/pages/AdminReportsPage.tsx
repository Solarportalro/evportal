import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  getAdminReports,
  type AdminReports,
  type CompanyPerformanceRow,
  type CountRow,
  type ReportFilters
} from "../adminReportsClient";

function FieldCard({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value ?? "—"}</p>
    </div>
  );
}

function CountTable({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-slate-100" key={row.key}>
                <td className="py-2 pr-4 text-slate-700">{row.key}</td>
                <td className="py-2 text-right font-medium text-slate-950">{row.count}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="py-2 text-slate-500">{title}</td>
                <td className="py-2 text-right">0</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KeyValueTable({ title, values }: { title: string; values: Record<string, number | string | null> }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {Object.entries(values).map(([key, value]) => (
              <tr className="border-t border-slate-100" key={key}>
                <td className="py-2 pr-4 text-slate-700">{key}</td>
                <td className="py-2 text-right font-medium text-slate-950">{value ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompanyTable({ rows }: { rows: CompanyPerformanceRow[] }) {
  const { t } = useTranslation();

  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="text-xl font-semibold text-slate-950">{t("adminReports.companyPerformance")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2 pr-4">{t("adminReports.company")}</th>
              <th className="py-2 pr-4">{t("adminReports.status")}</th>
              <th className="py-2 pr-4">{t("adminReports.offersSubmitted")}</th>
              <th className="py-2 pr-4">{t("adminReports.selectedOffers")}</th>
              <th className="py-2 pr-4">{t("adminReports.contactReveals")}</th>
              <th className="py-2 pr-4">{t("adminReports.selectionRate")}</th>
              <th className="py-2">{t("adminReports.averageResponseTimeHours")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-slate-100" key={row.companyId}>
                <td className="py-2 pr-4 font-medium text-slate-950">{row.publicName}</td>
                <td className="py-2 pr-4 text-slate-700">{row.status}</td>
                <td className="py-2 pr-4">{row.offersSubmitted}</td>
                <td className="py-2 pr-4">{row.selectedOffers}</td>
                <td className="py-2 pr-4">{row.contactReveals}</td>
                <td className="py-2 pr-4">{row.selectionRate}%</td>
                <td className="py-2">{row.averageResponseTimeHours ?? "—"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="py-3 text-slate-600" colSpan={7}>
                  {t("adminReports.noCompanies")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminReports(filters)
      .then((result) => {
        setReports(result);
        setMessage("");
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminReports.loadFailed")));
  }, [filters, t]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFilters({
      dateFrom: String(formData.get("dateFrom") ?? "") || undefined,
      dateTo: String(formData.get("dateTo") ?? "") || undefined
    });
  }

  return (
    <div className="grid gap-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("adminReports.title")}</h1>
        <p className="mt-2 text-slate-600">{t("adminReports.description")}</p>
      </section>

      <form className="flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          {t("adminReports.dateFrom")}
          <input className="rounded border border-slate-300 px-3 py-2" name="dateFrom" type="date" />
        </label>
        <label className="grid gap-1 text-sm">
          {t("adminReports.dateTo")}
          <input className="rounded border border-slate-300 px-3 py-2" name="dateTo" type="date" />
        </label>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
          {t("adminReports.applyFilters")}
        </button>
        <button className="rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800" type="button" onClick={() => setFilters({})}>
          {t("adminReports.clearFilters")}
        </button>
      </form>

      {message ? <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">{message}</p> : null}

      {reports ? (
        <>
          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-950">{t("adminReports.overview")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(reports.overview).map(([key, value]) => (
                <FieldCard key={key} label={key} value={value} />
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <KeyValueTable title={t("adminReports.funnelCounts")} values={reports.funnel.counts} />
            <KeyValueTable title={t("adminReports.funnelConversions")} values={reports.funnel.conversions} />
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-950">{t("adminReports.demand")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <CountTable title="requestsByFuelType" rows={reports.demand.requestsByFuelType} />
              <CountTable title="requestsByMode" rows={reports.demand.requestsByMode} />
              <CountTable title="requestsByBodyType" rows={reports.demand.requestsByBodyType} />
              <CountTable title="requestsByConditionPreference" rows={reports.demand.requestsByConditionPreference} />
              <CountTable title="requestsByFinancingInterest" rows={reports.demand.requestsByFinancingInterest} />
              <CountTable title="requestsByChargerNeed" rows={reports.demand.requestsByChargerNeed} />
              <CountTable title="requestsByHasSolar" rows={reports.demand.requestsByHasSolar} />
              <CountTable title="requestsBySolarChargingInterest" rows={reports.demand.requestsBySolarChargingInterest} />
              <CountTable title="topRequestedMakes" rows={reports.demand.topRequestedMakes} />
              <CountTable title="topRequestedModels" rows={reports.demand.topRequestedModels} />
              <KeyValueTable title="budgetDistribution" values={reports.demand.budgetDistribution} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-950">{t("adminReports.offers")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <CountTable title="offersByType" rows={reports.offers.offersByType} />
              <CountTable title="offersByAvailabilityStatus" rows={reports.offers.offersByAvailabilityStatus} />
              <CountTable title="offersByCondition" rows={reports.offers.offersByCondition} />
              <CountTable title="offersBySourceMarket" rows={reports.offers.offersBySourceMarket} />
              <CountTable title="offersByCurrency" rows={reports.offers.offersByCurrency} />
              <CountTable title="offersByChargingPortType" rows={reports.offers.offersByChargingPortType} />
              <CountTable title="offersByBatteryChemistry" rows={reports.offers.offersByBatteryChemistry} />
              <KeyValueTable
                title="offerFeatureCounts"
                values={{
                  offersWithFinancing: reports.offers.offersWithFinancing,
                  offersWithCharger: reports.offers.offersWithCharger,
                  offersWithTradeIn: reports.offers.offersWithTradeIn,
                  offersWithWarranty: reports.offers.offersWithWarranty,
                  offersWithBatteryWarranty: reports.offers.offersWithBatteryWarranty,
                  offersWithAdvancePayment: reports.offers.offersWithAdvancePayment,
                  selectedOfferCount: reports.offers.selectedOfferCount,
                  averageDeliveryDays: reports.offers.averageDeliveryDays
                }}
              />
              <CountTable title="topOfferedMakes" rows={reports.offers.topOfferedMakes} />
              <CountTable title="topOfferedModels" rows={reports.offers.topOfferedModels} />
              <KeyValueTable
                title="medianPriceByCurrency"
                values={Object.fromEntries(reports.offers.medianPriceByCurrency.map((row) => [row.currency, row.medianPrice]))}
              />
            </div>
          </section>

          <CompanyTable rows={reports.companies} />

          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-950">{t("adminReports.solarEv")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(reports.solarEv).map(([key, value]) => (
                <FieldCard key={key} label={key} value={value} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
