import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listCompanyOffers, withdrawCompanyOffer, type VehicleOfferWithRelations } from "../vehicleOfferClient";

export function CompanyOffersPage() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<VehicleOfferWithRelations[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  function loadOffers() {
    listCompanyOffers()
      .then((result) => setOffers(result.vehicleOffers))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("offers.loadFailed")));
  }

  useEffect(() => {
    loadOffers();
  }, []);

  async function handleWithdraw(offerId: string) {
    try {
      await withdrawCompanyOffer(offerId);
      loadOffers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("offers.updateFailed"));
    }
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("offers.myOffers")}</h1>
      <p className="mt-2 text-slate-600">{t("offers.myOffersDescription")}</p>
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      <div className="mt-6 grid gap-3">
        {offers.map((offer) => (
          <div className="rounded border border-slate-200 bg-white p-4" key={offer.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{offer.displayMake} {offer.displayModel}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {offer.priceAmount.toLocaleString()} {offer.currency} · {t(`offerStatuses.${offer.status}`)}
                </p>
              </div>
              <div className="flex gap-2">
                <Link className="rounded bg-slate-100 px-3 py-2 text-sm" to={`/company/requests/${offer.requestId}`}>
                  {t("companyRequests.details")}
                </Link>
                {offer.status !== "WITHDRAWN" ? (
                  <button className="rounded bg-red-700 px-3 py-2 text-sm text-white" onClick={() => void handleWithdraw(offer.id)} type="button">
                    {t("offers.withdraw")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {!offers.length && !message ? <p className="text-slate-600">{t("offers.empty")}</p> : null}
      </div>
    </section>
  );
}
