import { useTranslation } from "react-i18next";
import { PlaceholderPage } from "./PlaceholderPage";

export function CompanyRegisterPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t("pages.companyRegister.title")} description={t("pages.companyRegister.description")} />;
}
