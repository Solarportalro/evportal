import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { i18n } from "./i18n";
import { AdminPage } from "./pages/AdminPage";
import { CompanyDashboardPage } from "./pages/CompanyDashboardPage";
import { CompanyRegisterPage } from "./pages/CompanyRegisterPage";
import { CustomerDashboardPage } from "./pages/CustomerDashboardPage";
import { CustomerRequestDetailPage } from "./pages/CustomerRequestDetailPage";
import { CustomerRequestsPage } from "./pages/CustomerRequestsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NewCustomerRequestPage } from "./pages/NewCustomerRequestPage";
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
      { path: "company/dashboard", element: <CompanyDashboardPage /> },
      { path: "admin", element: <AdminPage /> },
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
