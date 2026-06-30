import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VehicleMake, VehicleModel } from "@evportal/shared";
import { createPublicVehicleRequest, type PublicVehicleRequestInput } from "../vehicleRequestClient";
import { listVehicleMakes, listVehicleModels } from "../vehicleCatalogClient";
import { buttonStyles, ErrorMessage, FieldHint, FormSection, SuccessMessage } from "../components/ui";

const fuelTypes = ["ELECTRIC", "PLUG_IN_HYBRID", "HYBRID", "GASOLINE", "DIESEL"];
const bodyTypes = ["SMALL_HATCHBACK", "SEDAN", "SUV_CROSSOVER", "VAN_BUSINESS", "OTHER"];
const stockPreferences = ["IN_STOCK_ONLY", "IMPORT_OK", "BOTH", "NOT_SURE"];
const timelines = ["ASAP", "ONE_TO_THREE_MONTHS", "JUST_EXPLORING"];
const solarValues = ["YES", "NO", "PLANNING", "UNKNOWN"];
const solarInterestValues = ["YES", "MAYBE_LATER", "NO", "NOT_ASKED"];
const conditionPreferences = ["NEW", "USED", "ANY", "NOT_SURE"];
const financingInterests = ["CASH", "FINANCING", "LEASING", "NOT_SURE"];
const chargerNeeds = ["YES", "NO", "NOT_SURE"];

function optionalNumber(value: string) {
  return value ? Number(value) : undefined;
}

export function PublicVehicleRequestPage() {
  const { t, i18n } = useTranslation();
  const [requestMode, setRequestMode] = useState("EXACT_MODEL");
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [manualMake, setManualMake] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [fuelType, setFuelType] = useState("ELECTRIC");
  const [bodyType, setBodyType] = useState("SUV_CROSSOVER");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [desiredRangeKm, setDesiredRangeKm] = useState("");
  const [stockImportPreference, setStockImportPreference] = useState("BOTH");
  const [purchaseTimeline, setPurchaseTimeline] = useState("ONE_TO_THREE_MONTHS");
  const [hasSolar, setHasSolar] = useState("UNKNOWN");
  const [solarChargingInterest, setSolarChargingInterest] = useState("NOT_ASKED");
  const [conditionPreference, setConditionPreference] = useState("NOT_SURE");
  const [maxMileageKm, setMaxMileageKm] = useState("");
  const [financingInterest, setFinancingInterest] = useState("NOT_SURE");
  const [tradeInInterest, setTradeInInterest] = useState(false);
  const [chargerNeeded, setChargerNeeded] = useState("NOT_SURE");
  const [customerRegion, setCustomerRegion] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [usageType, setUsageType] = useState("");
  const [chargingAccess, setChargingAccess] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [devSetPasswordUrl, setDevSetPasswordUrl] = useState<string | null>(null);

  useEffect(() => {
    listVehicleMakes()
      .then((result) => setMakes(result.makes))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("requests.catalogLoadFailed")));
  }, [t]);

  useEffect(() => {
    setModels([]);
    setModelId("");

    if (!makeId || makeId === "OTHER") {
      return;
    }

    listVehicleModels(makeId)
      .then((result) => setModels(result.models))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("requests.catalogLoadFailed")));
  }, [makeId, t]);

  const usesManualMake = makeId === "OTHER";
  const usesManualModel = usesManualMake || modelId === "OTHER";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSuccess(false);
    setDevSetPasswordUrl(null);

    const formData = new FormData(event.currentTarget);
    const input: PublicVehicleRequestInput = {
      fullName: String(formData.get("fullName") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      preferredLanguage: i18n.language || "hy",
      requestMode,
      fuelType,
      stockImportPreference,
      purchaseTimeline,
      hasSolar,
      solarChargingInterest,
      conditionPreference,
      maxMileageKm: optionalNumber(maxMileageKm),
      financingInterest,
      tradeInInterest,
      chargerNeeded,
      customerRegion: customerRegion || undefined,
      customerCity: customerCity || undefined,
      usageType: usageType || undefined,
      chargingAccess: chargingAccess || undefined,
      desiredRangeKm: optionalNumber(desiredRangeKm),
      notes: notes || undefined
    };

    if (requestMode === "EXACT_MODEL") {
      if (usesManualMake || usesManualModel) {
        input.manualMake = usesManualMake ? manualMake : makes.find((make) => make.id === makeId)?.name;
        input.manualModel = manualModel;
      } else {
        input.makeId = makeId;
        input.modelId = modelId;
      }
      input.budgetMin = optionalNumber(budgetMin);
      input.budgetMax = optionalNumber(budgetMax);
    } else {
      input.bodyType = bodyType;
      input.budgetMin = optionalNumber(budgetMin);
      input.budgetMax = optionalNumber(budgetMax);
    }

    try {
      const result = await createPublicVehicleRequest(input);
      setMessage(t("publicRequest.successDetailed"));
      setIsSuccess(true);
      setDevSetPasswordUrl(result.devSetPasswordUrl ?? null);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("publicRequest.createFailed"));
    }
  }

  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("publicRequest.title")}</h1>
      <p className="mt-2 text-slate-600">{t("publicRequest.description")}</p>
      <form className="mt-6 grid gap-5 rounded border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
        <FormSection title={t("formSections.contact")} description={t("publicRequest.trustText")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label={t("auth.fullName")} name="fullName" />
            <InputField label={t("auth.email")} name="email" type="email" />
            <InputField label={t("auth.phone")} name="phone" />
          </div>
        </FormSection>

        <FormSection title={t("formSections.vehicleNeed")} description={requestMode === "EXACT_MODEL" ? t("requests.exactHint") : t("requests.recommendationHint")}>
          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">{t("requests.mode")}</span>
            <div className="flex flex-wrap gap-2">
              <button className={requestMode === "EXACT_MODEL" ? buttonStyles.primary : buttonStyles.secondary} type="button" onClick={() => setRequestMode("EXACT_MODEL")}>
                {t("requests.exactMode")}
              </button>
              <button className={requestMode === "RECOMMENDATION" ? buttonStyles.primary : buttonStyles.secondary} type="button" onClick={() => setRequestMode("RECOMMENDATION")}>
                {t("requests.recommendationMode")}
              </button>
            </div>
          </div>

          {requestMode === "EXACT_MODEL" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <CatalogMakeField makes={makes} makeId={makeId} setMakeId={setMakeId} />
              {usesManualMake ? <TextField label={t("requests.manualMake")} value={manualMake} onChange={setManualMake} /> : <CatalogModelField disabled={!makeId} models={models} modelId={modelId} setModelId={setModelId} />}
              {usesManualModel ? <TextField label={t("requests.manualModel")} value={manualModel} onChange={setManualModel} /> : null}
            </div>
          ) : (
            <SelectField label={t("requests.bodyType")} options={bodyTypes} prefix="bodyTypes" value={bodyType} onChange={setBodyType} />
          )}
        </FormSection>

        <FormSection title={t("formSections.budgetTiming")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label={t("requests.budgetMin")} value={budgetMin} onChange={setBudgetMin} />
            <NumberField label={t("requests.budgetMax")} value={budgetMax} onChange={setBudgetMax} />
            <SelectField label={t("requests.timeline")} options={timelines} prefix="timelines" value={purchaseTimeline} onChange={setPurchaseTimeline} />
            <SelectField label={t("requests.stockPreference")} options={stockPreferences} prefix="stockPreferences" value={stockImportPreference} onChange={setStockImportPreference} />
          </div>
        </FormSection>

        <FormSection title={t("formSections.vehiclePreferences")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={t("requests.fuelType")} options={fuelTypes} prefix="fuelTypes" value={fuelType} onChange={setFuelType} />
            {requestMode === "EXACT_MODEL" ? null : <SelectField label={t("requests.bodyType")} options={bodyTypes} prefix="bodyTypes" value={bodyType} onChange={setBodyType} />}
            <SelectField label={t("requests.conditionPreference")} options={conditionPreferences} prefix="conditionPreferences" value={conditionPreference} onChange={setConditionPreference} />
            <NumberField label={t("requests.maxMileageKm")} value={maxMileageKm} onChange={setMaxMileageKm} />
            <NumberField label={t("requests.range")} value={desiredRangeKm} onChange={setDesiredRangeKm} />
            <SelectField label={t("requests.financingInterest")} options={financingInterests} prefix="financingInterests" value={financingInterest} onChange={setFinancingInterest} />
            <TextField label={t("requests.customerRegion")} value={customerRegion} onChange={setCustomerRegion} />
            <TextField label={t("requests.customerCity")} value={customerCity} onChange={setCustomerCity} />
            <TextField label={t("requests.usageType")} value={usageType} onChange={setUsageType} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input checked={tradeInInterest} type="checkbox" onChange={(event) => setTradeInInterest(event.target.checked)} />
            {t("requests.tradeInInterest")}
          </label>
        </FormSection>

        <FormSection title={t("formSections.chargingSolar")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={t("requests.hasSolar")} options={solarValues} prefix="solarValues" value={hasSolar} onChange={setHasSolar} />
            <SelectField label={t("requests.chargerNeeded")} options={chargerNeeds} prefix="chargerNeeds" value={chargerNeeded} onChange={setChargerNeeded} />
            <SelectField label={t("requests.solarInterest")} options={solarInterestValues} prefix="solarInterestValues" value={solarChargingInterest} onChange={setSolarChargingInterest} />
            <TextField label={t("requests.chargingAccess")} value={chargingAccess} onChange={setChargingAccess} />
          </div>
        </FormSection>

        <FormSection title={t("formSections.notes")}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("requests.notes")}
            <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </FormSection>

        {message ? isSuccess ? <SuccessMessage>{message}</SuccessMessage> : <ErrorMessage>{message}</ErrorMessage> : null}
        {devSetPasswordUrl ? (
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <FieldHint>{t("publicRequest.devOnly")}</FieldHint>
            <a className={`mt-2 inline-flex ${buttonStyles.dark}`} href={devSetPasswordUrl}>
              {t("publicRequest.devSetPassword")}
            </a>
          </div>
        ) : null}
        <p className="text-sm text-slate-600">{t("publicRequest.accountInstructions")}</p>
        <button className={`w-fit ${buttonStyles.primary}`} type="submit">
          {t("publicRequest.submit")}
        </button>
      </form>
    </section>
  );
}

function InputField(props: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      <input className="rounded border border-slate-300 px-3 py-2" name={props.name} required={props.required} type={props.type ?? "text"} />
    </label>
  );
}

function TextField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      <input className="rounded border border-slate-300 px-3 py-2" value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}

function NumberField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      <input className="rounded border border-slate-300 px-3 py-2" min="0" type="number" value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}

function SelectField(props: { label: string; options: string[]; prefix: string; value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      <select className="rounded border border-slate-300 px-3 py-2" value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {t(`${props.prefix}.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CatalogMakeField(props: { makes: VehicleMake[]; makeId: string; setMakeId: (value: string) => void }) {
  const { t } = useTranslation();

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {t("requests.make")}
      <select className="rounded border border-slate-300 px-3 py-2" value={props.makeId} onChange={(event) => props.setMakeId(event.target.value)}>
        <option value="">{t("requests.selectMake")}</option>
        {props.makes.map((make) => (
          <option key={make.id} value={make.id}>
            {make.name}
          </option>
        ))}
        <option value="OTHER">{t("requests.otherNotListed")}</option>
      </select>
    </label>
  );
}

function CatalogModelField(props: { disabled: boolean; models: VehicleModel[]; modelId: string; setModelId: (value: string) => void }) {
  const { t } = useTranslation();

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {t("requests.model")}
      <select className="rounded border border-slate-300 px-3 py-2" disabled={props.disabled} value={props.modelId} onChange={(event) => props.setModelId(event.target.value)}>
        <option value="">{t("requests.selectModel")}</option>
        {props.models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
        <option value="OTHER">{t("requests.otherNotListed")}</option>
      </select>
    </label>
  );
}
