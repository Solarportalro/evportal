import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMe, logout, type SafeUser } from "../authClient";

export function CustomerDashboardPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((result) => setUser(result.user))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("auth.failed")));
  }, [t]);

  async function handleLogout() {
    await logout();
    setUser(null);
    setMessage(t("auth.loggedOut"));
  }

  return (
    <section className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("pages.customerDashboard.title")}</h1>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="button" onClick={handleLogout}>
          {t("auth.logout")}
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
      {user ? (
        <pre className="mt-6 overflow-auto rounded border border-slate-200 bg-white p-4 text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
