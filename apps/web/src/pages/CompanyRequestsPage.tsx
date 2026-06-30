import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { VehicleRequest } from "../vehicleRequestClient";
import { listCompanyVehicleRequests } from "../vehicleOfferClient";

export function CompanyRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listCompanyVehicleRequests()
      .then((result) => setRequests(result.vehicleRequests))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("offers.loadFailed")));
  }, [t]);

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("companyRequests.title")}</h1>
      <p className="mt-2 text-slate-600">{t("companyRequests.description")}</p>
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      <div className="mt-6 grid gap-3">
        {requests.map((request) => (
          <Link
            className="rounded border border-slate-200 bg-white p-4 transition hover:border-emerald-600"
            key={request.id}
            to={`/company/requests/${request.id}`}
          >
            <div className="flex flex-wrap justify-between gap-3">
              <p className="font-medium text-slate-950">
                {request.displayMake && request.displayModel
                  ? `${request.displayMake} ${request.displayModel}`
                  : t(`requestModes.${request.requestMode}`)}
              </p>
              <p className="text-sm text-slate-600">{t(`requestStatuses.${request.status}`)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {t(`fuelTypes.${request.fuelType}`)} · {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
        {!requests.length && !message ? <p className="text-slate-600">{t("companyRequests.empty")}</p> : null}
      </div>
    </section>
  );
}
