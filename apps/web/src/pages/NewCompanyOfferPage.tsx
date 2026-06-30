import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listVehicleMakes, listVehicleModels } from "../vehicleCatalogClient";
import type { VehicleMake, VehicleModel } from "@evportal/shared";
import { createCompanyOffer, type VehicleOfferInput } from "../vehicleOfferClient";
import { buttonStyles, ErrorMessage, FieldHint, FormSection } from "../components/ui";

const offerTypes = ["IN_STOCK", "IMPORT_ORDER", "ALTERNATIVE_RECOMMENDATION"];
const fuelTypes = ["ELECTRIC", "PLUG_IN_HYBRID", "HYBRID", "GASOLINE", "DIESEL"];
const availabilityStatuses = ["IN_ARMENIA", "IN_TRANSIT", "IMPORT_REQUIRED"];
const currencies = ["AMD", "USD", "EUR"];
const vehicleConditions = ["NEW", "USED", "UNKNOWN"];
const sourceMarkets = ["ARMENIA", "CHINA", "EUROPE", "USA", "KOREA", "JAPAN", "UAE", "OTHER", "UNKNOWN"];
const batteryChemistries = ["LFP", "NMC", "UNKNOWN"];
const chargingPortTypes = ["CCS2", "GBT", "TYPE2", "TESLA_NACS", "OTHER", "UNKNOWN"];

function optionalNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

function isCompanyStatusBlock(message: string | null) {
  return Boolean(message?.toUpperCase().includes("APPROVAL") || message?.toUpperCase().includes("SUSPENDED") || message?.toUpperCase().includes("REJECTED"));
}

export function NewCompanyOfferPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makeId, setMakeId] = useState("");
  const [useManualVehicle, setUseManualVehicle] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listVehicleMakes()
      .then((result) => setMakes(result.makes))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("requests.catalogLoadFailed")));
  }, [t]);

  useEffect(() => {
    if (!makeId) {
      setModels([]);
      return;
    }

    listVehicleModels(makeId)
      .then((result) => setModels(result.models))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("requests.catalogLoadFailed")));
  }, [makeId, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!requestId) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const input: VehicleOfferInput = {
      offerType: String(formData.get("offerType")),
      fuelType: String(formData.get("fuelType")),
      availabilityStatus: String(formData.get("availabilityStatus")),
      priceAmount: Number(formData.get("priceAmount")),
      currency: String(formData.get("currency")),
      makeId: useManualVehicle ? undefined : optionalText(formData.get("makeId")),
      modelId: useManualVehicle ? undefined : optionalText(formData.get("modelId")),
      manualMake: useManualVehicle ? optionalText(formData.get("manualMake")) : undefined,
      manualModel: useManualVehicle ? optionalText(formData.get("manualModel")) : undefined,
      year: optionalNumber(formData.get("year")),
      trim: optionalText(formData.get("trim")),
      batteryCapacityKwh: optionalNumber(formData.get("batteryCapacityKwh")),
      rangeKm: optionalNumber(formData.get("rangeKm")),
      mileageKm: optionalNumber(formData.get("mileageKm")),
      color: optionalText(formData.get("color")),
      condition: String(formData.get("condition")),
      sourceMarket: String(formData.get("sourceMarket")),
      batteryChemistry: String(formData.get("batteryChemistry")),
      chargingPortType: String(formData.get("chargingPortType")),
      acChargingKw: optionalNumber(formData.get("acChargingKw")),
      dcFastChargingKw: optionalNumber(formData.get("dcFastChargingKw")),
      driveType: optionalText(formData.get("driveType")),
      accidentHistoryDeclared: optionalText(formData.get("accidentHistoryDeclared")),
      vinAvailable: formData.get("vinAvailable") === "on",
      photosAvailable: formData.get("photosAvailable") === "on",
      documentsAvailable: formData.get("documentsAvailable") === "on",
      inspectionIncluded: formData.get("inspectionIncluded") === "on",
      sourceCountry: optionalText(formData.get("sourceCountry")),
      estimatedDeliveryDaysMin: optionalNumber(formData.get("estimatedDeliveryDaysMin")),
      estimatedDeliveryDaysMax: optionalNumber(formData.get("estimatedDeliveryDaysMax")),
      priceIncludesCustoms: formData.get("priceIncludesCustoms") === "on",
      priceIncludesRegistration: formData.get("priceIncludesRegistration") === "on",
      priceIncludesDeliveryToArmenia: formData.get("priceIncludesDeliveryToArmenia") === "on",
      priceIncludesDealerFee: formData.get("priceIncludesDealerFee") === "on",
      priceIsFinal: formData.get("priceIsFinal") === "on",
      advancePaymentRequired: formData.get("advancePaymentRequired") === "on",
      advancePaymentAmount: optionalNumber(formData.get("advancePaymentAmount")),
      advancePaymentRefundable: formData.get("advancePaymentRefundable") === "on",
      warrantyMonths: optionalNumber(formData.get("warrantyMonths")),
      batteryWarrantyMonths: optionalNumber(formData.get("batteryWarrantyMonths")),
      warrantyProvider: optionalText(formData.get("warrantyProvider")),
      serviceSupportIncluded: formData.get("serviceSupportIncluded") === "on",
      chargerIncluded: formData.get("chargerIncluded") === "on",
      financingAvailable: formData.get("financingAvailable") === "on",
      tradeInAccepted: formData.get("tradeInAccepted") === "on",
      notes: optionalText(formData.get("notes"))
    };

    try {
      const result = await createCompanyOffer(requestId, input);
      navigate(`/company/requests/${result.vehicleOffer.requestId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("offers.createFailed"));
    }
  }

  return (
    <section className="max-w-5xl">
      <Link className="text-sm font-medium text-emerald-700" to={requestId ? `/company/requests/${requestId}` : "/company/requests"}>
        {t("companyRequests.backToRequests")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{t("offers.newOffer")}</h1>
      <FieldHint>{t("offers.requiredHint")}</FieldHint>
      {message ? (
        <div className="mt-6">
          <ErrorMessage>
            {isCompanyStatusBlock(message) ? t("companyProfile.statusBlocked") : message}
            {isCompanyStatusBlock(message) ? (
              <Link className="ml-2 font-medium text-emerald-700" to="/company/profile">
                {t("companyProfile.goToProfile")}
              </Link>
            ) : null}
          </ErrorMessage>
        </div>
      ) : null}
      <form className="mt-6 grid gap-5 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
        <FormSection title={t("offerSections.type")} description={t("offers.offerTypeHint")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectInput label={t("offers.offerType")} name="offerType" options={offerTypes} prefix="offerTypes" required />
          </div>
        </FormSection>

        <FormSection title={t("offerSections.vehicle")}>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={useManualVehicle} onChange={(event) => setUseManualVehicle(event.target.checked)} />
            {t("requests.otherNotListed")}
          </label>
          {useManualVehicle ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label={t("requests.manualMake")} name="manualMake" required />
              <InputField label={t("requests.manualModel")} name="manualModel" required />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("requests.make")} *
                <select className="rounded border border-slate-300 px-3 py-2" name="makeId" required value={makeId} onChange={(event) => setMakeId(event.target.value)}>
                  <option value="">{t("requests.selectMake")}</option>
                  {makes.map((make) => (
                    <option key={make.id} value={make.id}>
                      {make.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("requests.model")} *
                <select className="rounded border border-slate-300 px-3 py-2" name="modelId" required>
                  <option value="">{t("requests.selectModel")}</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label={t("offers.year")} name="year" type="number" />
            <InputField label={t("offers.trim")} name="trim" />
            <SelectInput label={t("requests.fuelType")} name="fuelType" options={fuelTypes} prefix="fuelTypes" required />
            <SelectInput label={t("offers.condition")} name="condition" options={vehicleConditions} prefix="vehicleConditions" />
            <InputField label={t("offers.mileageKm")} name="mileageKm" type="number" />
            <InputField label={t("offers.rangeKm")} name="rangeKm" type="number" />
            <InputField label={t("offers.batteryKwh")} name="batteryCapacityKwh" step="0.1" type="number" />
            <SelectInput label={t("offers.batteryChemistry")} name="batteryChemistry" options={batteryChemistries} prefix="batteryChemistries" />
            <SelectInput label={t("offers.chargingPortType")} name="chargingPortType" options={chargingPortTypes} prefix="chargingPortTypes" />
            <InputField label={t("offers.color")} name="color" />
            <InputField label={t("offers.driveType")} name="driveType" />
            <InputField label={t("offers.accidentHistoryDeclared")} name="accidentHistoryDeclared" />
            <InputField label={t("offers.acChargingKw")} name="acChargingKw" step="0.1" type="number" />
            <InputField label={t("offers.dcFastChargingKw")} name="dcFastChargingKw" step="0.1" type="number" />
          </div>
        </FormSection>

        <FormSection title={t("offerSections.availability")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput label={t("offers.availability")} name="availabilityStatus" options={availabilityStatuses} prefix="availabilityStatuses" required />
            <SelectInput label={t("offers.sourceMarket")} name="sourceMarket" options={sourceMarkets} prefix="sourceMarkets" />
            <InputField label={t("offers.sourceCountry")} name="sourceCountry" />
            <InputField label={t("offers.deliveryMin")} name="estimatedDeliveryDaysMin" type="number" />
            <InputField label={t("offers.deliveryMax")} name="estimatedDeliveryDaysMax" type="number" />
          </div>
        </FormSection>

        <FormSection title={t("offerSections.price")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label={t("offers.priceAmount")} name="priceAmount" required type="number" />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("offers.currency")} *
              <select className="rounded border border-slate-300 px-3 py-2" name="currency" required>
                {currencies.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <CheckboxGrid names={["priceIsFinal", "priceIncludesCustoms", "priceIncludesRegistration", "priceIncludesDeliveryToArmenia", "priceIncludesDealerFee"]} />
        </FormSection>

        <FormSection title={t("offerSections.paymentWarranty")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label={t("offers.advancePaymentAmount")} name="advancePaymentAmount" type="number" />
            <InputField label={t("offers.warrantyMonths")} name="warrantyMonths" type="number" />
            <InputField label={t("offers.batteryWarrantyMonths")} name="batteryWarrantyMonths" type="number" />
            <InputField label={t("offers.warrantyProvider")} name="warrantyProvider" />
          </div>
          <CheckboxGrid names={["advancePaymentRequired", "advancePaymentRefundable", "serviceSupportIncluded"]} />
        </FormSection>

        <FormSection title={t("offerSections.extras")}>
          <CheckboxGrid names={["chargerIncluded", "financingAvailable", "tradeInAccepted", "vinAvailable", "photosAvailable", "documentsAvailable", "inspectionIncluded"]} />
        </FormSection>

        <FormSection title={t("offerSections.notes")}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("requests.notes")}
            <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" name="notes" />
          </label>
        </FormSection>

        <button className={`w-fit ${buttonStyles.primary}`} type="submit">
          {t("offers.submitOffer")}
        </button>
      </form>
    </section>
  );
}

function InputField(props: { label: string; name: string; type?: string; required?: boolean; step?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      {props.required ? " *" : ""}
      <input className="rounded border border-slate-300 px-3 py-2" name={props.name} required={props.required} step={props.step} type={props.type ?? "text"} />
    </label>
  );
}

function SelectInput(props: { label: string; name: string; options: string[]; prefix: string; required?: boolean }) {
  const { t } = useTranslation();

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {props.label}
      {props.required ? " *" : ""}
      <select className="rounded border border-slate-300 px-3 py-2" name={props.name} required={props.required}>
        {props.options.map((value) => (
          <option key={value} value={value}>
            {t(`${props.prefix}.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxGrid({ names }: { names: string[] }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {names.map((name) => (
        <label className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={name}>
          <input name={name} type="checkbox" />
          {t(`offers.${name}`)}
        </label>
      ))}
    </div>
  );
}
