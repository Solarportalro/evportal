import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function HomePage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.home.title")} description={t("pages.home.description")} />;
}
