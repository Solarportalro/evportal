import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listCustomerOffersForRequest, selectCustomerOffer, type VehicleOfferWithRelations } from "../vehicleOfferClient";
import { buttonStyles, EmptyState, ErrorMessage, StatusBadge, SuccessMessage } from "../components/ui";

function deliveryText(offer: VehicleOfferWithRelations) {
  if (offer.estimatedDeliveryDaysMin && offer.estimatedDeliveryDaysMax) {
    return `${offer.estimatedDeliveryDaysMin}-${offer.estimatedDeliveryDaysMax}`;
  }

  return offer.estimatedDeliveryDaysMin ?? offer.estimatedDeliveryDaysMax ?? "—";
}

function booleanBadges(offer: VehicleOfferWithRelations) {
  return [
    ["chargerIncluded", offer.chargerIncluded],
    ["financingAvailable", offer.financingAvailable],
    ["tradeInAccepted", offer.tradeInAccepted],
    ["priceIncludesCustoms", offer.priceIncludesCustoms],
    ["priceIncludesRegistration", offer.priceIncludesRegistration],
    ["priceIncludesDeliveryToArmenia", offer.priceIncludesDeliveryToArmenia],
    ["priceIncludesDealerFee", offer.priceIncludesDealerFee],
    ["vinAvailable", offer.vinAvailable],
    ["photosAvailable", offer.photosAvailable],
    ["documentsAvailable", offer.documentsAvailable],
    ["inspectionIncluded", offer.inspectionIncluded]
  ] as Array<[string, boolean]>;
}

export function CustomerRequestOffersPage() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const [offers, setOffers] = useState<VehicleOfferWithRelations[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
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
      setIsSuccess(true);
      setMessage(t("contactReveal.successMessage"));
      loadOffers();
    } catch (error) {
      setIsSuccess(false);
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
      <p className="mt-3 rounded border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {t("contactReveal.selectionTrustText")}
      </p>
      {message ? <div className="mt-6">{isSuccess ? <SuccessMessage>{message}</SuccessMessage> : <ErrorMessage>{message}</ErrorMessage>}</div> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {offers.map((offer) => (
          <article className={`rounded border bg-white p-5 shadow-sm ${offer.status === "SELECTED" ? "border-emerald-300" : "border-slate-200"}`} key={offer.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {offer.displayMake} {offer.displayModel}
                </h2>
                <p className="text-sm text-slate-600">{offer.company?.publicName ?? t("offers.companyOffer")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={offer.status === "SELECTED" ? "emerald" : "slate"}>{t(`offerStatuses.${offer.status}`)}</StatusBadge>
                  <StatusBadge>{t(`offerTypes.${offer.offerType}`)}</StatusBadge>
                </div>
              </div>
              <p className="text-xl font-semibold text-emerald-700">
                {offer.priceAmount.toLocaleString()} {offer.currency}
              </p>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Info label={t("offers.availability")} value={t(`availabilityStatuses.${offer.availabilityStatus}`)} />
              <Info label={t("offers.delivery")} value={deliveryText(offer)} />
              <Info label={t("offers.year")} value={offer.year ?? "—"} />
              <Info label={t("offers.mileageKm")} value={offer.mileageKm ?? "—"} />
              <Info label={t("offers.rangeKm")} value={offer.rangeKm ?? "—"} />
              <Info label={t("offers.condition")} value={t(`vehicleConditions.${offer.condition}`)} />
              <Info label={t("offers.warrantyMonths")} value={offer.warrantyMonths ?? "—"} />
              <Info label={t("offers.batteryWarrantyMonths")} value={offer.batteryWarrantyMonths ?? "—"} />
              <Info label={t("offers.chargingPortType")} value={t(`chargingPortTypes.${offer.chargingPortType}`)} />
              <Info label={t("offers.batteryChemistry")} value={t(`batteryChemistries.${offer.batteryChemistry}`)} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {booleanBadges(offer)
                .filter(([, enabled]) => enabled)
                .map(([name]) => (
                  <StatusBadge key={name} tone="emerald">
                    {t(`offers.${name}`)}
                  </StatusBadge>
                ))}
            </div>
            {offer.notes ? <p className="mt-4 rounded bg-slate-50 p-3 text-sm text-slate-700">{offer.notes}</p> : null}
            <div className="mt-5">
              {offer.status === "SELECTED" ? (
                <SuccessMessage>{t("contactReveal.selectedState")}</SuccessMessage>
              ) : ["SUBMITTED", "UPDATED"].includes(offer.status) && !hasSelectedOffer ? (
                <button className={buttonStyles.primary} onClick={() => void handleSelectOffer(offer.id)} type="button">
                  {t("contactReveal.interestedButton")}
                </button>
              ) : (
                <p className="text-sm text-slate-500">{hasSelectedOffer ? t("contactReveal.selectionClosed") : t(`offerStatuses.${offer.status}`)}</p>
              )}
            </div>
          </article>
        ))}
        {!offers.length && !message ? <EmptyState>{t("offers.empty")}</EmptyState> : null}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
