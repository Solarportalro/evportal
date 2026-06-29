import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function CompanyDashboardPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.companyDashboard.title")} description={t("pages.companyDashboard.description")} />;
}
