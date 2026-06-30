import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getVehicleRequest, type VehicleRequest } from "../vehicleRequestClient";

export function CustomerRequestDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [request, setRequest] = useState<VehicleRequest | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    getVehicleRequest(id)
      .then((result) => setRequest(result.vehicleRequest))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("requests.loadFailed")));
  }, [id, t]);

  return (
    <section className="max-w-4xl">
      <Link className="text-sm font-medium text-emerald-700" to="/customer/requests">
        {t("requests.backToRequests")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{t("requests.details")}</h1>
      {id ? (
        <Link className="mt-4 inline-flex rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" to={`/customer/requests/${id}/offers`}>
          {t("offers.compareOffers")}
        </Link>
      ) : null}
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      {request ? (
        <div className="mt-6 rounded border border-slate-200 bg-white p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            {Object.entries(request).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-medium uppercase text-slate-500">{key}</dt>
                <dd className="mt-1 break-words text-sm text-slate-900">{value === null ? "—" : String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
