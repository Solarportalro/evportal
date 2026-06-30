import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import {
  changeAdminUserRole,
  disableAdminUser,
  enableAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUser,
  type AdminUser
} from "../adminUserClient";
import { getMe, type SafeUser } from "../authClient";

const roles = ["CUSTOMER", "COMPANY_USER", "COMPANY_ADMIN", "SUPPORT", "PLATFORM_ADMIN"];

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    setMessage(null);
    getMe().then((result) => setCurrentUser(result.user)).catch(() => setCurrentUser(null));

    if (userId) {
      getAdminUser(userId)
        .then((result) => setUser(result.user))
        .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminUsers.loadFailed")));
      return;
    }

    listAdminUsers()
      .then((result) => setUsers(result.users))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminUsers.loadFailed")));
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function handleDisable(targetUser: AdminUser) {
    try {
      const reason = window.prompt(t("adminUsers.disableReasonPrompt")) ?? undefined;
      const result = await disableAdminUser(targetUser.id, reason);
      if (userId) {
        setUser(result.user);
      } else {
        setUsers((items) => items.map((item) => (item.id === result.user.id ? result.user : item)));
      }
      setMessage(t("adminUsers.disableSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminUsers.actionFailed"));
    }
  }

  async function handleEnable(targetUser: AdminUser) {
    try {
      const result = await enableAdminUser(targetUser.id);
      if (userId) {
        setUser(result.user);
      } else {
        setUsers((items) => items.map((item) => (item.id === result.user.id ? result.user : item)));
      }
      setMessage(t("adminUsers.enableSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminUsers.actionFailed"));
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    try {
      const result = await updateAdminUser(user.id, {
        preferredLanguage: text(formData.get("preferredLanguage")),
        isEmailVerified: formData.get("isEmailVerified") === "on",
        isPhoneVerified: formData.get("isPhoneVerified") === "on"
      });
      setUser(result.user);
      setMessage(t("adminUsers.updateSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminUsers.actionFailed"));
    }
  }

  async function handleRoleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    try {
      const result = await changeAdminUserRole(user.id, String(formData.get("role")), text(formData.get("adminNote")));
      setUser(result.user);
      setMessage(t("adminUsers.roleChangeSuccess"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminUsers.actionFailed"));
    }
  }

  if (!userId) {
    return (
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("adminUsers.title")}</h1>
        <p className="mt-2 text-slate-600">{t("adminUsers.description")}</p>
        {message ? <p className="mt-6 text-sm text-slate-700">{message}</p> : null}
        <div className="mt-6 grid gap-3">
          {users.map((item) => (
            <div className="rounded border border-slate-200 bg-white p-4" key={item.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{item.email ?? item.phone ?? item.id}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t(`userRoles.${item.role}`)} · {item.isActive ? t("adminUsers.active") : t("adminUsers.disabled")} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.companyMemberships.length ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {item.companyMemberships.map((membership) => membership.company.publicName).join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <Link className="rounded bg-slate-100 px-3 py-2 text-sm" to={`/admin/users/${item.id}`}>
                    {t("adminUsers.view")}
                  </Link>
                  {item.isActive ? (
                    <button className="rounded bg-red-700 px-3 py-2 text-sm text-white" onClick={() => void handleDisable(item)} type="button">
                      {t("adminUsers.disable")}
                    </button>
                  ) : (
                    <button className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" onClick={() => void handleEnable(item)} type="button">
                      {t("adminUsers.enable")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!users.length && !message ? <p className="text-slate-600">{t("adminUsers.empty")}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl">
      <Link className="text-sm text-emerald-700" to="/admin/users">
        {t("adminUsers.backToList")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{t("adminUsers.detailTitle")}</h1>
      {message ? <p className="mt-6 text-sm text-slate-700">{message}</p> : null}
      {user ? (
        <div className="mt-6 grid gap-6">
          <div className="rounded border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{user.email ?? user.phone ?? user.id}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {t(`userRoles.${user.role}`)} · {user.isActive ? t("adminUsers.active") : t("adminUsers.disabled")}
                </p>
                {user.disabledReason ? <p className="mt-2 text-sm text-red-700">{user.disabledReason}</p> : null}
              </div>
              {user.isActive ? (
                <button className="rounded bg-red-700 px-3 py-2 text-sm text-white" onClick={() => void handleDisable(user)} type="button">
                  {t("adminUsers.disable")}
                </button>
              ) : (
                <button className="rounded bg-emerald-700 px-3 py-2 text-sm text-white" onClick={() => void handleEnable(user)} type="button">
                  {t("adminUsers.enable")}
                </button>
              )}
            </div>
          </div>

          <form className="grid gap-4 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleUpdate(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["email", user.email],
                ["phone", user.phone],
                ["normalizedEmail", user.normalizedEmail],
                ["normalizedPhone", user.normalizedPhone],
                ["preferredLanguage", user.preferredLanguage]
              ] as Array<[string, string | null]>).map(([name, value]) => (
                <label className="grid gap-1 text-sm" key={name}>
                  {t(`adminUsers.${name}`)}
                  <input className="rounded border border-slate-300 px-3 py-2" defaultValue={value ?? ""} disabled={name !== "preferredLanguage"} name={name} />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input defaultChecked={user.isEmailVerified} name="isEmailVerified" type="checkbox" />
                {t("adminUsers.isEmailVerified")}
              </label>
              <label className="flex items-center gap-2">
                <input defaultChecked={user.isPhoneVerified} name="isPhoneVerified" type="checkbox" />
                {t("adminUsers.isPhoneVerified")}
              </label>
            </div>
            <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              {t("adminUsers.save")}
            </button>
          </form>

          {currentUser?.role === "PLATFORM_ADMIN" ? (
            <form className="grid gap-4 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleRoleChange(event)}>
              <h2 className="font-medium text-slate-950">{t("adminUsers.roleManagement")}</h2>
              <select className="rounded border border-slate-300 px-3 py-2" defaultValue={user.role} name="role">
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {t(`userRoles.${role}`)}
                  </option>
                ))}
              </select>
              <input className="rounded border border-slate-300 px-3 py-2" name="adminNote" placeholder={t("adminUsers.adminNote")} />
              <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
                {t("adminUsers.changeRole")}
              </button>
            </form>
          ) : null}

          <div className="grid gap-4 rounded border border-slate-200 bg-white p-5 text-sm">
            <h2 className="font-medium text-slate-950">{t("adminUsers.globalCustomer")}</h2>
            <p>{user.globalCustomer?.fullName ?? "—"}</p>
            <p>{user.globalCustomer?.normalizedEmail ?? user.globalCustomer?.normalizedPhone ?? "—"}</p>
          </div>

          <div className="grid gap-3 rounded border border-slate-200 bg-white p-5 text-sm">
            <h2 className="font-medium text-slate-950">{t("adminUsers.companyMemberships")}</h2>
            {user.companyMemberships.map((membership) => (
              <p key={membership.id}>
                {membership.role} · {membership.company.publicName} · {t(`companyStatuses.${membership.company.status}`)}
              </p>
            ))}
            {!user.companyMemberships.length ? <p className="text-slate-600">{t("adminUsers.noMemberships")}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
