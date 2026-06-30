import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PlaceholderPage } from "./PlaceholderPage";

export function AdminPage() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PlaceholderPage title={t("pages.admin.title")} description={t("pages.admin.description")} />
      <div>
        <Link className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" to="/admin/vehicle-catalog">
          {t("adminCatalog.title")}
        </Link>
      </div>
    </div>
  );
}
