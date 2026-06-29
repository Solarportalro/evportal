import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function CustomerDashboardPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.customerDashboard.title")} description={t("pages.customerDashboard.description")} />;
}
