import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getAdminVehicleRequest,
  listAdminVehicleRequests,
  transitionAdminVehicleRequest,
  type AdminVehicleRequest
} from "../adminVehicleRequestClient";

const actionsByStatus: Record<string, Array<{ action: string; labelKey: string }>> = {
  SUBMITTED: [
    { action: "approve", labelKey: "adminRequests.approve" },
    { action: "reject", labelKey: "adminRequests.reject" },
    { action: "cancel", labelKey: "adminRequests.cancel" }
  ],
  UNDER_REVIEW: [
    { action: "approve", labelKey: "adminRequests.approve" },
    { action: "reject", labelKey: "adminRequests.reject" },
    { action: "cancel", labelKey: "adminRequests.cancel" }
  ],
  REJECTED: [{ action: "approve", labelKey: "adminRequests.approve" }],
  ACTIVE: [
    { action: "cancel", labelKey: "adminRequests.cancel" },
    { action: "expire", labelKey: "adminRequests.expire" },
    { action: "close-without-purchase", labelKey: "adminRequests.closeWithoutPurchase" }
  ],
  OFFERS_RECEIVED: [
    { action: "expire", labelKey: "adminRequests.expire" },
    { action: "close-successfully", labelKey: "adminRequests.closeSuccessfully" },
    { action: "close-without-purchase", labelKey: "adminRequests.closeWithoutPurchase" },
    { action: "cancel", labelKey: "adminRequests.cancel" }
  ],
  CUSTOMER_DECIDING: [
    { action: "expire", labelKey: "adminRequests.expire" },
    { action: "close-successfully", labelKey: "adminRequests.closeSuccessfully" },
    { action: "close-without-purchase", labelKey: "adminRequests.closeWithoutPurchase" },
    { action: "cancel", labelKey: "adminRequests.cancel" }
  ],
  COMPANY_SELECTED: [
    { action: "close-successfully", labelKey: "adminRequests.closeSuccessfully" },
    { action: "close-without-purchase", labelKey: "adminRequests.closeWithoutPurchase" }
  ]
};

function vehicleTitle(request: AdminVehicleRequest, fallback: string) {
  return request.displayMake && request.displayModel ? `${request.displayMake} ${request.displayModel}` : fallback;
}

export function AdminVehicleRequestsPage() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<AdminVehicleRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AdminVehicleRequest | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function loadRequests() {
    listAdminVehicleRequests()
      .then((result) => setRequests(result.vehicleRequests))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminRequests.loadFailed")));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!requestId) {
      setSelectedRequest(null);
      return;
    }

    getAdminVehicleRequest(requestId)
      .then((result) => setSelectedRequest(result.vehicleRequest))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : t("adminRequests.loadFailed")));
  }, [requestId, t]);

  const visibleRequests = useMemo(() => (selectedRequest ? [selectedRequest] : requests), [requests, selectedRequest]);

  async function handleTransition(request: AdminVehicleRequest, action: string) {
    const adminNote = window.prompt(t("adminRequests.adminNotePrompt")) ?? undefined;

    try {
      const result = await transitionAdminVehicleRequest(request.id, action, adminNote);
      setMessage(t("adminRequests.transitionSuccess"));
      setSelectedRequest((current) => (current?.id === request.id ? result.vehicleRequest : current));
      loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("adminRequests.transitionFailed"));
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("adminRequests.title")}</h1>
          <p className="mt-2 text-slate-600">{t("adminRequests.description")}</p>
        </div>
        {selectedRequest ? (
          <Link className="rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800" to="/admin/vehicle-requests">
            {t("adminRequests.backToList")}
          </Link>
        ) : null}
      </div>
      {message ? <p className="mt-6 text-sm text-slate-700">{message}</p> : null}
      <div className="mt-6 grid gap-4">
        {visibleRequests.map((request) => (
          <article className="rounded border border-slate-200 bg-white p-5" key={request.id}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <Link className="font-semibold text-slate-950" to={`/admin/vehicle-requests/${request.id}`}>
                  {vehicleTitle(request, t(`requestModes.${request.requestMode}`))}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  {request.id.slice(-8)} · {request.customer?.globalCustomer?.fullName ?? request.customer?.email ?? request.customer?.phone ?? "—"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t(`fuelTypes.${request.fuelType}`)} · {request.budgetMin ?? "—"}-{request.budgetMax ?? "—"} ·{" "}
                  {new Date(request.createdAt).toLocaleDateString()} · {request._count?.offers ?? 0} {t("adminRequests.offers")}
                </p>
              </div>
              <p className="h-fit rounded bg-slate-100 px-3 py-1 text-sm text-slate-700">{t(`requestStatuses.${request.status}`)}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(actionsByStatus[request.status] ?? []).map((action) => (
                <button
                  className="rounded bg-emerald-700 px-3 py-2 text-sm font-medium text-white"
                  key={action.action}
                  onClick={() => void handleTransition(request, action.action)}
                  type="button"
                >
                  {t(action.labelKey)}
                </button>
              ))}
              {!(actionsByStatus[request.status] ?? []).length ? (
                <p className="text-sm text-slate-500">{t("adminRequests.noActions")}</p>
              ) : null}
            </div>
            {selectedRequest ? (
              <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                {Object.entries(request).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium uppercase text-slate-500">{key}</dt>
                    <dd className="mt-1 break-words text-sm text-slate-900">
                      {value === null || value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </article>
        ))}
        {!visibleRequests.length && !message ? <p className="text-slate-600">{t("adminRequests.empty")}</p> : null}
      </div>
    </section>
  );
}
