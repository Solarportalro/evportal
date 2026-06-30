import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { VehicleRequest } from "../vehicleRequestClient";
import { getCompanyVehicleRequest, listCompanyOffersForRequest, type VehicleOfferWithRelations } from "../vehicleOfferClient";

export function CompanyRequestDetailPage() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const [request, setRequest] = useState<VehicleRequest | null>(null);
  const [offers, setOffers] = useState<VehicleOfferWithRelations[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      return;
    }

    Promise.all([getCompanyVehicleRequest(requestId), listCompanyOffersForRequest(requestId)])
      .then(([requestResult, offersResult]) => {
        setRequest(requestResult.vehicleRequest);
        setOffers(offersResult.vehicleOffers);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("offers.loadFailed")));
  }, [requestId, t]);

  return (
    <section className="max-w-5xl">
      <Link className="text-sm font-medium text-emerald-700" to="/company/requests">
        {t("companyRequests.backToRequests")}
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("companyRequests.details")}</h1>
          {request ? (
            <p className="mt-2 text-slate-600">
              {request.displayMake && request.displayModel
                ? `${request.displayMake} ${request.displayModel}`
                : t(`requestModes.${request.requestMode}`)}
            </p>
          ) : null}
        </div>
        {requestId ? (
          <Link className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" to={`/company/requests/${requestId}/offers/new`}>
            {t("offers.submitOffer")}
          </Link>
        ) : null}
      </div>
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      {request ? (
        <div className="mt-6 rounded border border-slate-200 bg-white p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            {["status", "fuelType", "budgetMin", "budgetMax", "desiredRangeKm", "purchaseTimeline", "notes"].map((key) => (
              <div key={key}>
                <dt className="text-xs font-medium uppercase text-slate-500">{key}</dt>
                <dd className="mt-1 break-words text-sm text-slate-900">{String(request[key as keyof VehicleRequest] ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <h2 className="mt-8 text-xl font-semibold text-slate-950">{t("offers.myOffers")}</h2>
      <div className="mt-4 grid gap-3">
        {offers.map((offer) => (
          <div className="rounded border border-slate-200 bg-white p-4" key={offer.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <p className="font-medium">{offer.displayMake} {offer.displayModel}</p>
              <p className="text-sm text-slate-600">{t(`offerStatuses.${offer.status}`)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {offer.priceAmount.toLocaleString()} {offer.currency} · {t(`availabilityStatuses.${offer.availabilityStatus}`)}
            </p>
          </div>
        ))}
        {!offers.length ? <p className="text-slate-600">{t("offers.empty")}</p> : null}
      </div>
    </section>
  );
}
