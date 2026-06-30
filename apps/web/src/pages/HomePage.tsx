import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PlaceholderPage } from "./PlaceholderPage";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PlaceholderPage title={t("pages.home.title")} description={t("pages.home.description")} />
      <Link className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" to="/request/new">
        {t("publicRequest.homeLink")}
      </Link>
    </div>
  );
}
