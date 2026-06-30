import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { PlaceholderPage } from "./PlaceholderPage";

const adminCards = [
  { to: "/admin/vehicle-requests", titleKey: "adminRequests.title", descriptionKey: "adminDashboard.vehicleRequestsDescription" },
  { to: "/admin/vehicle-offers", titleKey: "adminOffers.title", descriptionKey: "adminDashboard.vehicleOffersDescription" },
  { to: "/admin/vehicle-offers", titleKey: "contactReveal.adminTitle", descriptionKey: "adminDashboard.contactRevealsDescription" },
  { to: "/admin/companies", titleKey: "adminCompanies.title", descriptionKey: "adminDashboard.companiesDescription" },
  { to: "/admin/users", titleKey: "adminUsers.title", descriptionKey: "adminDashboard.usersDescription" },
  { to: "/admin/vehicle-catalog", titleKey: "adminCatalog.title", descriptionKey: "adminDashboard.catalogDescription" },
  { to: "/admin/reports", titleKey: "adminReports.title", descriptionKey: "adminDashboard.reportsDescription" }
];

export function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PlaceholderPage title={t("pages.admin.title")} description={t("pages.admin.description")} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => (
          <Link className="block transition hover:-translate-y-0.5" key={`${card.to}-${card.titleKey}`} to={card.to}>
            <Card className="h-full">
              <h2 className="text-lg font-semibold text-slate-950">{t(card.titleKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t(card.descriptionKey)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
