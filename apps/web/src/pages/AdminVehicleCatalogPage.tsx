import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createAdminMake,
  createAdminModel,
  listAdminMakes,
  listAdminModels,
  setAdminMakeActive,
  setAdminModelActive,
  updateAdminMake,
  updateAdminModel,
  type AdminVehicleMake,
  type AdminVehicleModel
} from "../adminVehicleCatalogClient";

export function AdminVehicleCatalogPage() {
  const { t } = useTranslation();
  const [makes, setMakes] = useState<AdminVehicleMake[]>([]);
  const [models, setModels] = useState<AdminVehicleModel[]>([]);
  const [selectedMake, setSelectedMake] = useState<AdminVehicleMake | null>(null);
  const [makeName, setMakeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function loadMakes() {
    const result = await listAdminMakes();
    setMakes(result.makes);

    if (selectedMake) {
      const updated = result.makes.find((make) => make.id === selectedMake.id) ?? null;
      setSelectedMake(updated);
    }
  }

  async function loadModels(makeId: string) {
    const result = await listAdminModels(makeId);
    setModels(result.models);
  }

  useEffect(() => {
    loadMakes().catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminCatalog.loadFailed")));
  }, []);

  async function handleCreateMake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    await createAdminMake(makeName);
    setMakeName("");
    await loadMakes();
  }

  async function handleUpdateMake(make: AdminVehicleMake) {
    const name = window.prompt(t("adminCatalog.makeName"), make.name);

    if (!name) {
      return;
    }

    await updateAdminMake(make.id, name);
    await loadMakes();
  }

  async function handleToggleMake(make: AdminVehicleMake) {
    await setAdminMakeActive(make.id, !make.isActive);
    await loadMakes();
  }

  async function handleSelectMake(make: AdminVehicleMake) {
    setSelectedMake(make);
    setMessage(null);
    await loadModels(make.id);
  }

  async function handleCreateModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMake) {
      return;
    }

    setMessage(null);
    await createAdminModel(selectedMake.id, modelName);
    setModelName("");
    await loadModels(selectedMake.id);
    await loadMakes();
  }

  async function handleUpdateModel(model: AdminVehicleModel) {
    if (!selectedMake) {
      return;
    }

    const name = window.prompt(t("adminCatalog.modelName"), model.name);

    if (!name) {
      return;
    }

    await updateAdminModel(model.id, name);
    await loadModels(selectedMake.id);
  }

  async function handleToggleModel(model: AdminVehicleModel) {
    if (!selectedMake) {
      return;
    }

    await setAdminModelActive(model.id, !model.isActive);
    await loadModels(selectedMake.id);
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("adminCatalog.title")}</h1>
      <p className="mt-2 text-slate-600">{t("adminCatalog.description")}</p>
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{t("adminCatalog.makes")}</h2>
          </div>
          <form className="mt-4 flex gap-2" onSubmit={(event) => void handleCreateMake(event)}>
            <input
              className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
              placeholder={t("adminCatalog.makeName")}
              value={makeName}
              onChange={(event) => setMakeName(event.target.value)}
            />
            <button className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
              {t("adminCatalog.addMake")}
            </button>
          </form>
          <div className="mt-4 grid gap-2">
            {makes.map((make) => (
              <div className="rounded border border-slate-200 p-3" key={make.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button className="text-left font-medium text-slate-950" type="button" onClick={() => void handleSelectMake(make)}>
                    {make.name}
                  </button>
                  <span className={`text-xs font-medium ${make.isActive ? "text-emerald-700" : "text-slate-500"}`}>
                    {make.isActive ? t("adminCatalog.active") : t("adminCatalog.inactive")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{t("adminCatalog.modelCount", { count: make._count?.models ?? 0 })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded bg-slate-100 px-3 py-1 text-sm" type="button" onClick={() => void handleUpdateMake(make)}>
                    {t("adminCatalog.edit")}
                  </button>
                  <button className="rounded bg-slate-100 px-3 py-1 text-sm" type="button" onClick={() => void handleToggleMake(make)}>
                    {make.isActive ? t("adminCatalog.deactivate") : t("adminCatalog.activate")}
                  </button>
                  <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white" type="button" onClick={() => void handleSelectMake(make)}>
                    {t("adminCatalog.manageModels")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">{selectedMake ? selectedMake.name : t("adminCatalog.models")}</h2>
          {selectedMake ? (
            <>
              <form className="mt-4 flex gap-2" onSubmit={(event) => void handleCreateModel(event)}>
                <input
                  className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
                  placeholder={t("adminCatalog.modelName")}
                  value={modelName}
                  onChange={(event) => setModelName(event.target.value)}
                />
                <button className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
                  {t("adminCatalog.addModel")}
                </button>
              </form>
              <div className="mt-4 grid gap-2">
                {models.map((model) => (
                  <div className="rounded border border-slate-200 p-3" key={model.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-950">{model.name}</p>
                      <span className={`text-xs font-medium ${model.isActive ? "text-emerald-700" : "text-slate-500"}`}>
                        {model.isActive ? t("adminCatalog.active") : t("adminCatalog.inactive")}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded bg-slate-100 px-3 py-1 text-sm" type="button" onClick={() => void handleUpdateModel(model)}>
                        {t("adminCatalog.edit")}
                      </button>
                      <button className="rounded bg-slate-100 px-3 py-1 text-sm" type="button" onClick={() => void handleToggleModel(model)}>
                        {model.isActive ? t("adminCatalog.deactivate") : t("adminCatalog.activate")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-slate-600">{t("adminCatalog.selectMake")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
