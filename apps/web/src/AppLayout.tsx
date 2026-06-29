import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const navItems = [
  { to: "/", labelKey: "nav.home" },
  { to: "/login", labelKey: "nav.login" },
  { to: "/register", labelKey: "nav.register" },
  { to: "/company/register", labelKey: "nav.companyRegister" },
  { to: "/customer/dashboard", labelKey: "nav.customerDashboard" },
  { to: "/company/dashboard", labelKey: "nav.companyDashboard" },
  { to: "/admin", labelKey: "nav.admin" }
];

export function AppLayout() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight">EV Portal</p>
            <p className="text-sm text-slate-600">by SolarPortal</p>
          </div>
          <select
            className="w-fit rounded border border-slate-300 bg-white px-3 py-2 text-sm"
            value={i18n.language}
            aria-label={t("language.select")}
            onChange={(event) => void i18n.changeLanguage(event.target.value)}
          >
            <option value="hy">Հայերեն</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 ${isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
      <footer className="mx-auto flex max-w-6xl gap-4 px-4 py-8 text-sm text-slate-600">
        <NavLink to="/privacy">{t("nav.privacy")}</NavLink>
        <NavLink to="/terms">{t("nav.terms")}</NavLink>
      </footer>
    </div>
  );
}
