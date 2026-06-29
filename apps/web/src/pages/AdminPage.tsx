import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function AdminPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.admin.title")} description={t("pages.admin.description")} />;
}
