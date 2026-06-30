import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { i18n } from "./i18n";
import { AdminCompaniesPage } from "./pages/AdminCompaniesPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminVehicleCatalogPage } from "./pages/AdminVehicleCatalogPage";
import { AdminVehicleOffersPage } from "./pages/AdminVehicleOffersPage";
import { AdminVehicleRequestsPage } from "./pages/AdminVehicleRequestsPage";
import { CompanyDashboardPage } from "./pages/CompanyDashboardPage";
import { CompanyOffersPage } from "./pages/CompanyOffersPage";
import { CompanyProfilePage } from "./pages/CompanyProfilePage";
import { CompanyRegisterPage } from "./pages/CompanyRegisterPage";
import { CompanyRequestDetailPage } from "./pages/CompanyRequestDetailPage";
import { CompanyRequestsPage } from "./pages/CompanyRequestsPage";
import { CustomerDashboardPage } from "./pages/CustomerDashboardPage";
import { CustomerRequestDetailPage } from "./pages/CustomerRequestDetailPage";
import { CustomerRequestOffersPage } from "./pages/CustomerRequestOffersPage";
import { CustomerRequestsPage } from "./pages/CustomerRequestsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NewCustomerRequestPage } from "./pages/NewCustomerRequestPage";
import { NewCompanyOfferPage } from "./pages/NewCompanyOfferPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TermsPage } from "./pages/TermsPage";
import "./styles.css";

void i18n.changeLanguage(i18n.language);

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "company/register", element: <CompanyRegisterPage /> },
      { path: "customer/dashboard", element: <CustomerDashboardPage /> },
      { path: "customer/requests", element: <CustomerRequestsPage /> },
      { path: "customer/requests/new", element: <NewCustomerRequestPage /> },
      { path: "customer/requests/:id", element: <CustomerRequestDetailPage /> },
      { path: "customer/requests/:requestId/offers", element: <CustomerRequestOffersPage /> },
      { path: "company/dashboard", element: <CompanyDashboardPage /> },
      { path: "company/profile", element: <CompanyProfilePage /> },
      { path: "company/requests", element: <CompanyRequestsPage /> },
      { path: "company/requests/:requestId", element: <CompanyRequestDetailPage /> },
      { path: "company/requests/:requestId/offers/new", element: <NewCompanyOfferPage /> },
      { path: "company/offers", element: <CompanyOffersPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "admin/companies", element: <AdminCompaniesPage /> },
      { path: "admin/companies/:companyId", element: <AdminCompaniesPage /> },
      { path: "admin/vehicle-catalog", element: <AdminVehicleCatalogPage /> },
      { path: "admin/vehicle-offers", element: <AdminVehicleOffersPage /> },
      { path: "admin/vehicle-requests", element: <AdminVehicleRequestsPage /> },
      { path: "admin/vehicle-requests/:requestId", element: <AdminVehicleRequestsPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
