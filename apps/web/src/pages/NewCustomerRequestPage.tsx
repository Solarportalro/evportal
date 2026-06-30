import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { VehicleMake, VehicleModel } from "@evportal/shared";
import { createVehicleRequest, type CreateVehicleRequestInput } from "../vehicleRequestClient";
import { listVehicleMakes, listVehicleModels } from "../vehicleCatalogClient";

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

export function NewCustomerRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requestMode, setRequestMode] = useState("EXACT_MODEL");
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [manualMake, setManualMake] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [fuelType, setFuelType] = useState("ELECTRIC");
  const [preferredYearFrom, setPreferredYearFrom] = useState("");
  const [preferredYearTo, setPreferredYearTo] = useState("");
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

    const input: CreateVehicleRequestInput = {
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
      preferredYearFrom: optionalNumber(preferredYearFrom),
      preferredYearTo: optionalNumber(preferredYearTo),
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
      const result = await createVehicleRequest(input);
      navigate(`/customer/requests/${result.vehicleRequest.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("requests.createFailed"));
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("requests.newRequest")}</h1>
      <form className="mt-6 grid gap-5 rounded border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">{t("requests.mode")}</span>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded px-4 py-2 text-sm ${requestMode === "EXACT_MODEL" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}
              type="button"
              onClick={() => setRequestMode("EXACT_MODEL")}
            >
              {t("requests.exactMode")}
            </button>
            <button
              className={`rounded px-4 py-2 text-sm ${requestMode === "RECOMMENDATION" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}
              type="button"
              onClick={() => setRequestMode("RECOMMENDATION")}
            >
              {t("requests.recommendationMode")}
            </button>
          </div>
        </div>

        {requestMode === "EXACT_MODEL" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("requests.make")}
              <select className="rounded border border-slate-300 px-3 py-2" value={makeId} onChange={(event) => setMakeId(event.target.value)}>
                <option value="">{t("requests.selectMake")}</option>
                {makes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.name}
                  </option>
                ))}
                <option value="OTHER">{t("requests.otherNotListed")}</option>
              </select>
            </label>
            {usesManualMake ? (
              <TextField label={t("requests.manualMake")} value={manualMake} onChange={setManualMake} />
            ) : (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("requests.model")}
                <select
                  className="rounded border border-slate-300 px-3 py-2"
                  disabled={!makeId}
                  value={modelId}
                  onChange={(event) => setModelId(event.target.value)}
                >
                  <option value="">{t("requests.selectModel")}</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                  <option value="OTHER">{t("requests.otherNotListed")}</option>
                </select>
              </label>
            )}
            {usesManualModel ? <TextField label={t("requests.manualModel")} value={manualModel} onChange={setManualModel} /> : null}
          </div>
        ) : (
          <SelectField label={t("requests.bodyType")} options={bodyTypes} prefix="bodyTypes" value={bodyType} onChange={setBodyType} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t("requests.fuelType")} options={fuelTypes} prefix="fuelTypes" value={fuelType} onChange={setFuelType} />
          <SelectField
            label={t("requests.stockPreference")}
            options={stockPreferences}
            prefix="stockPreferences"
            value={stockImportPreference}
            onChange={setStockImportPreference}
          />
          <NumberField label={t("requests.yearFrom")} value={preferredYearFrom} onChange={setPreferredYearFrom} />
          <NumberField label={t("requests.yearTo")} value={preferredYearTo} onChange={setPreferredYearTo} />
          <NumberField label={t("requests.budgetMin")} value={budgetMin} onChange={setBudgetMin} />
          <NumberField label={t("requests.budgetMax")} value={budgetMax} onChange={setBudgetMax} />
          <NumberField label={t("requests.range")} value={desiredRangeKm} onChange={setDesiredRangeKm} />
          <SelectField label={t("requests.timeline")} options={timelines} prefix="timelines" value={purchaseTimeline} onChange={setPurchaseTimeline} />
          <SelectField label={t("requests.hasSolar")} options={solarValues} prefix="solarValues" value={hasSolar} onChange={setHasSolar} />
          <SelectField
            label={t("requests.solarInterest")}
            options={solarInterestValues}
            prefix="solarInterestValues"
            value={solarChargingInterest}
            onChange={setSolarChargingInterest}
          />
          <SelectField label={t("requests.conditionPreference")} options={conditionPreferences} prefix="conditionPreferences" value={conditionPreference} onChange={setConditionPreference} />
          <NumberField label={t("requests.maxMileageKm")} value={maxMileageKm} onChange={setMaxMileageKm} />
          <SelectField label={t("requests.financingInterest")} options={financingInterests} prefix="financingInterests" value={financingInterest} onChange={setFinancingInterest} />
          <SelectField label={t("requests.chargerNeeded")} options={chargerNeeds} prefix="chargerNeeds" value={chargerNeeded} onChange={setChargerNeeded} />
          <TextField label={t("requests.customerRegion")} value={customerRegion} onChange={setCustomerRegion} />
          <TextField label={t("requests.customerCity")} value={customerCity} onChange={setCustomerCity} />
          <TextField label={t("requests.usageType")} value={usageType} onChange={setUsageType} />
          <TextField label={t("requests.chargingAccess")} value={chargingAccess} onChange={setChargingAccess} />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input checked={tradeInInterest} type="checkbox" onChange={(event) => setTradeInInterest(event.target.checked)} />
          {t("requests.tradeInInterest")}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {t("requests.notes")}
          <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>

        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
          {t("requests.submit")}
        </button>
      </form>
    </section>
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
      <input
        className="rounded border border-slate-300 px-3 py-2"
        min="0"
        type="number"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  options: string[];
  prefix: string;
  value: string;
  onChange: (value: string) => void;
}) {
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
