import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function RegisterPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.register.title")} description={t("pages.register.description")} />;
}
