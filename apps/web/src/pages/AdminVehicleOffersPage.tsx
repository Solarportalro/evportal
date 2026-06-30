import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listAdminContactReveals, listAdminVehicleOffers, type ContactRevealWithRelations, type VehicleOfferWithRelations } from "../vehicleOfferClient";

export function AdminVehicleOffersPage() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<VehicleOfferWithRelations[]>([]);
  const [contactReveals, setContactReveals] = useState<ContactRevealWithRelations[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listAdminVehicleOffers(), listAdminContactReveals()])
      .then(([offersResult, revealsResult]) => {
        setOffers(offersResult.vehicleOffers);
        setContactReveals(revealsResult.contactReveals);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("offers.loadFailed")));
  }, [t]);

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("adminOffers.title")}</h1>
      <p className="mt-2 text-slate-600">{t("adminOffers.description")}</p>
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3">{t("offers.vehicle")}</th>
              <th className="p-3">{t("offers.company")}</th>
              <th className="p-3">{t("offers.priceAmount")}</th>
              <th className="p-3">{t("offers.status")}</th>
              <th className="p-3">{t("offers.createdAt")}</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr className="border-t border-slate-200" key={offer.id}>
                <td className="p-3">{offer.displayMake} {offer.displayModel}</td>
                <td className="p-3">{offer.company?.publicName ?? "—"}</td>
                <td className="p-3">{offer.priceAmount.toLocaleString()} {offer.currency}</td>
                <td className="p-3">{t(`offerStatuses.${offer.status}`)}</td>
                <td className="p-3">{new Date(offer.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!offers.length && !message ? <p className="p-4 text-slate-600">{t("offers.empty")}</p> : null}
      </div>
      <h2 className="mt-8 text-xl font-semibold text-slate-950">{t("contactReveal.adminTitle")}</h2>
      <div className="mt-4 grid gap-3">
        {contactReveals.map((reveal) => (
          <div className="rounded border border-slate-200 bg-white p-4 text-sm" key={reveal.id}>
            <p className="font-medium text-slate-950">{reveal.company?.publicName ?? "—"}</p>
            <p className="mt-1 text-slate-600">
              {reveal.customerName ?? "—"} · {reveal.customerPhone ?? reveal.customerEmail ?? "—"} ·{" "}
              {new Date(reveal.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
        {!contactReveals.length ? <p className="text-slate-600">{t("contactReveal.adminEmpty")}</p> : null}
      </div>
    </section>
  );
}
