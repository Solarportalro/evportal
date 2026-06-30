import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listCustomerOffersForRequest, selectCustomerOffer, type VehicleOfferWithRelations } from "../vehicleOfferClient";

export function CustomerRequestOffersPage() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const [offers, setOffers] = useState<VehicleOfferWithRelations[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const hasSelectedOffer = offers.some((offer) => offer.status === "SELECTED");

  function loadOffers() {
    if (!requestId) {
      return;
    }

    listCustomerOffersForRequest(requestId)
      .then((result) => setOffers(result.vehicleOffers))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("offers.loadFailed")));
  }

  useEffect(() => {
    loadOffers();
  }, [requestId, t]);

  async function handleSelectOffer(offerId: string) {
    if (!window.confirm(t("contactReveal.confirmText"))) {
      return;
    }

    try {
      await selectCustomerOffer(offerId);
      setMessage(t("contactReveal.successMessage"));
      loadOffers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("contactReveal.selectFailed"));
    }
  }

  return (
    <section>
      <Link className="text-sm font-medium text-emerald-700" to={requestId ? `/customer/requests/${requestId}` : "/customer/requests"}>
        {t("requests.backToRequests")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{t("offers.compareOffers")}</h1>
      <p className="mt-2 text-slate-600">{t("offers.compareDescription")}</p>
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {offers.map((offer) => (
          <article className="rounded border border-slate-200 bg-white p-5" key={offer.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{offer.displayMake} {offer.displayModel}</h2>
                <p className="text-sm text-slate-600">{offer.company?.publicName}</p>
              </div>
              <p className="font-medium text-emerald-700">{offer.priceAmount.toLocaleString()} {offer.currency}</p>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">{t("offers.availability")}</dt><dd>{t(`availabilityStatuses.${offer.availabilityStatus}`)}</dd></div>
              <div><dt className="text-slate-500">{t("offers.delivery")}</dt><dd>{offer.estimatedDeliveryDaysMin ?? "—"}-{offer.estimatedDeliveryDaysMax ?? "—"}</dd></div>
              <div><dt className="text-slate-500">{t("offers.warrantyMonths")}</dt><dd>{offer.warrantyMonths ?? "—"}</dd></div>
              <div><dt className="text-slate-500">{t("offers.chargerIncluded")}</dt><dd>{offer.chargerIncluded ? t("common.yes") : t("common.no")}</dd></div>
              <div><dt className="text-slate-500">{t("offers.financingAvailable")}</dt><dd>{offer.financingAvailable ? t("common.yes") : t("common.no")}</dd></div>
              <div><dt className="text-slate-500">{t("offers.tradeInAccepted")}</dt><dd>{offer.tradeInAccepted ? t("common.yes") : t("common.no")}</dd></div>
            </dl>
            {offer.notes ? <p className="mt-4 text-sm text-slate-700">{offer.notes}</p> : null}
            <div className="mt-4">
              {offer.status === "SELECTED" ? (
                <p className="rounded bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  {t("contactReveal.selectedState")}
                </p>
              ) : ["SUBMITTED", "UPDATED"].includes(offer.status) && !hasSelectedOffer ? (
                <button
                  className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => void handleSelectOffer(offer.id)}
                  type="button"
                >
                  {t("contactReveal.interestedButton")}
                </button>
              ) : (
                <p className="text-sm text-slate-500">{t(`offerStatuses.${offer.status}`)}</p>
              )}
            </div>
          </article>
        ))}
        {!offers.length && !message ? <p className="text-slate-600">{t("offers.empty")}</p> : null}
      </div>
    </section>
  );
}
