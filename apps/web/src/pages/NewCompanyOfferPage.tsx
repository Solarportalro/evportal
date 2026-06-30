import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listVehicleMakes, listVehicleModels } from "../vehicleCatalogClient";
import type { VehicleMake, VehicleModel } from "@evportal/shared";
import { createCompanyOffer, type VehicleOfferInput } from "../vehicleOfferClient";

const offerTypes = ["IN_STOCK", "IMPORT_ORDER", "ALTERNATIVE_RECOMMENDATION"];
const fuelTypes = ["ELECTRIC", "PLUG_IN_HYBRID", "HYBRID", "GASOLINE", "DIESEL"];
const availabilityStatuses = ["IN_ARMENIA", "IN_TRANSIT", "IMPORT_REQUIRED"];
const currencies = ["AMD", "USD", "EUR"];

function optionalNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
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
      {message ? <p className="mt-6 text-sm text-red-700">{message}</p> : null}
      <form className="mt-6 grid gap-5 rounded border border-slate-200 bg-white p-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            {t("offers.offerType")}
            <select className="rounded border border-slate-300 px-3 py-2" name="offerType" required>
              {offerTypes.map((value) => <option key={value} value={value}>{t(`offerTypes.${value}`)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            {t("requests.fuelType")}
            <select className="rounded border border-slate-300 px-3 py-2" name="fuelType" required>
              {fuelTypes.map((value) => <option key={value} value={value}>{t(`fuelTypes.${value}`)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            {t("offers.availability")}
            <select className="rounded border border-slate-300 px-3 py-2" name="availabilityStatus" required>
              {availabilityStatuses.map((value) => <option key={value} value={value}>{t(`availabilityStatuses.${value}`)}</option>)}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useManualVehicle} onChange={(event) => setUseManualVehicle(event.target.checked)} />
          {t("requests.otherNotListed")}
        </label>
        {useManualVehicle ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2" name="manualMake" placeholder={t("requests.manualMake")} required />
            <input className="rounded border border-slate-300 px-3 py-2" name="manualModel" placeholder={t("requests.manualModel")} required />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <select className="rounded border border-slate-300 px-3 py-2" name="makeId" required value={makeId} onChange={(event) => setMakeId(event.target.value)}>
              <option value="">{t("requests.selectMake")}</option>
              {makes.map((make) => <option key={make.id} value={make.id}>{make.name}</option>)}
            </select>
            <select className="rounded border border-slate-300 px-3 py-2" name="modelId" required>
              <option value="">{t("requests.selectModel")}</option>
              {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-4">
          <input className="rounded border border-slate-300 px-3 py-2" name="year" placeholder={t("offers.year")} type="number" />
          <input className="rounded border border-slate-300 px-3 py-2" name="trim" placeholder={t("offers.trim")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="rangeKm" placeholder={t("offers.rangeKm")} type="number" />
          <input className="rounded border border-slate-300 px-3 py-2" name="mileageKm" placeholder={t("offers.mileageKm")} type="number" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <input className="rounded border border-slate-300 px-3 py-2" name="batteryCapacityKwh" placeholder={t("offers.batteryKwh")} type="number" step="0.1" />
          <input className="rounded border border-slate-300 px-3 py-2" name="color" placeholder={t("offers.color")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="sourceCountry" placeholder={t("offers.sourceCountry")} />
          <input className="rounded border border-slate-300 px-3 py-2" name="warrantyProvider" placeholder={t("offers.warrantyProvider")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <input className="rounded border border-slate-300 px-3 py-2" name="estimatedDeliveryDaysMin" placeholder={t("offers.deliveryMin")} type="number" />
          <input className="rounded border border-slate-300 px-3 py-2" name="estimatedDeliveryDaysMax" placeholder={t("offers.deliveryMax")} type="number" />
          <input className="rounded border border-slate-300 px-3 py-2" name="warrantyMonths" placeholder={t("offers.warrantyMonths")} type="number" />
          <input className="rounded border border-slate-300 px-3 py-2" name="batteryWarrantyMonths" placeholder={t("offers.batteryWarrantyMonths")} type="number" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <input className="rounded border border-slate-300 px-3 py-2" name="priceAmount" placeholder={t("offers.priceAmount")} type="number" required />
          <select className="rounded border border-slate-300 px-3 py-2" name="currency" required>
            {currencies.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input className="rounded border border-slate-300 px-3 py-2" name="advancePaymentAmount" placeholder={t("offers.advancePaymentAmount")} type="number" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            "priceIncludesCustoms",
            "priceIncludesRegistration",
            "priceIncludesDeliveryToArmenia",
            "priceIncludesDealerFee",
            "priceIsFinal",
            "advancePaymentRequired",
            "advancePaymentRefundable",
            "serviceSupportIncluded",
            "chargerIncluded",
            "financingAvailable",
            "tradeInAccepted"
          ].map((name) => (
            <label className="flex items-center gap-2 text-sm" key={name}>
              <input name={name} type="checkbox" />
              {t(`offers.${name}`)}
            </label>
          ))}
        </div>
        <textarea className="min-h-28 rounded border border-slate-300 px-3 py-2" name="notes" placeholder={t("requests.notes")} />
        <button className="w-fit rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" type="submit">
          {t("offers.submitOffer")}
        </button>
      </form>
    </section>
  );
}
