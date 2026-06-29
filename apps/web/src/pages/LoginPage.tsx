import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { login, saveTokens } from "../authClient";

export function LoginPage() {
  const { t } = useTranslation();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await login({ emailOrPhone, password });
      saveTokens(result.tokens);
      setMessage(`${t("auth.loggedIn")} ${result.user.email ?? result.user.phone ?? result.user.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("auth.failed"));
    }
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("pages.login.title")}</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {t("auth.emailOrPhone")}
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={emailOrPhone}
            onChange={(event) => setEmailOrPhone(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {t("auth.password")}
          <input
            className="rounded border border-slate-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
          {t("nav.login")}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
