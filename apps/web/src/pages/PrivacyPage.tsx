import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function PrivacyPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.privacy.title")} description={t("pages.privacy.description")} />;
}
