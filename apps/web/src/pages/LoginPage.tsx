import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function LoginPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.login.title")} description={t("pages.login.description")} />;
}
