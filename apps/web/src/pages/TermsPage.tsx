import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function TermsPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.terms.title")} description={t("pages.terms.description")} />;
}
