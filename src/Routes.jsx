import React, { useState } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";

import Settings from "./pages/settings";
import ExpensesPage from "./pages/expenses";
import InventoryManagement from "./pages/inventory-management";
import Properties from "./pages/properties";
import TeamAndHR from "./pages/team-and-hr";
import Login from "./pages/login";
import TasksAndPlanning from "./pages/tasks-and-planning";
import PricingRules from "./pages/pricing-rules";
import Dashboard from "./pages/dashboard";
import ReservationsPage from "./pages/reservations";
import AutomationAndAI from "./pages/automation-and-ai";
import ReservationDetails from "./pages/reservation-details";
import AuditLog from "./pages/audit-log";
import RevenuesAndReports from "./pages/revenues-and-reports";
import UsersManagement from "./pages/users-management";
import AccountProfile from "./pages/account-profile";
import ReservationEditPage from "./pages/reservations/ReservationEditPage";

import ResetPassword from "./pages/reset-password";
import UpdatePassword from "./pages/update-password";
import PropertyOwnerView from "./pages/property-owner-view";
import PropertyPublicView from "./pages/property-public-view";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RequirePermissionRoute from "./components/RequirePermissionRoute";

import Header from "./components/ui/Header";
import Sidebar from "./components/ui/Sidebar";

// Preview mode
const isPreviewMode =
  window?.location?.hostname?.includes("builtwithrocket") ||
  window?.location?.hostname?.includes("preview") ||
  process.env.NODE_ENV === "development";

// Public Route
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (isPreviewMode) return children;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/reservations" replace />;

  return children;
};

// Protected layout wrapper
const ProtectedLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header title="" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="lg:ml-60 pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6 max-w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
};

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Redirect root */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/reservations" replace />
              </ProtectedRoute>
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="dashboard.view">
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Reservations list */}
          <Route
            path="/reservations"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="reservations.view">
                  <ProtectedLayout>
                    <ReservationsPage />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* ✅ Reservation details dynamique */}
          <Route
            path="/reservations/:id"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="reservationDetails.view">
                  <ProtectedLayout>
                    <ReservationDetails />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* ✅ Edit Reservation Route - sans garde de permission pour test */}
<Route
  path="/reservations/:id/edit"
  element={
    <ProtectedRoute>
      <ProtectedLayout>
        <ReservationEditPage />
      </ProtectedLayout>
    </ProtectedRoute>
  }
/>

          {/* 🔁 Ancienne route (compatibilité) */}
          <Route
            path="/reservation-details"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="reservationDetails.view">
                  <ProtectedLayout>
                    <ReservationDetails />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Tasks */}
          <Route
            path="/tasks-and-planning"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="tasks.view">
                  <ProtectedLayout>
                    <TasksAndPlanning />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Properties */}
          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="properties.view">
                  <ProtectedLayout>
                    <Properties />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Property Owner View */}
          <Route
            path="/properties/:id/owner"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="properties.view">
                  <ProtectedLayout>
                    <PropertyOwnerView />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Property Public View - NEW ROUTE */}
<Route
  path="/properties/:id/public"
  element={<PropertyPublicView />}
/>

          {/* Inventory */}
          <Route
            path="/inventory-management"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="inventory.view">
                  <ProtectedLayout>
                    <InventoryManagement />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Team & HR */}
          <Route
            path="/team-and-hr"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="team.view">
                  <ProtectedLayout>
                    <TeamAndHR />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Users */}
          <Route
            path="/users-management"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="users.view">
                  <ProtectedLayout>
                    <UsersManagement />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Expenses */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="expenses.view">
                  <ProtectedLayout>
                    <ExpensesPage />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Pricing Rules */}
          <Route
            path="/pricing-rules"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="pricing.view">
                  <ProtectedLayout>
                    <PricingRules />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Revenues & Reports */}
          <Route
            path="/revenues-and-reports"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="revenues.view">
                  <ProtectedLayout>
                    <RevenuesAndReports />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Automation */}
          <Route
            path="/automation-and-ai"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="automation.view">
                  <ProtectedLayout>
                    <AutomationAndAI />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="settings.view">
                  <ProtectedLayout>
                    <Settings />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Audit log */}
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute>
                <RequirePermissionRoute perm="audit.view">
                  <ProtectedLayout>
                    <AuditLog />
                  </ProtectedLayout>
                </RequirePermissionRoute>
              </ProtectedRoute>
            }
          />

          {/* Account profile */}
          <Route
            path="/account-profile"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <AccountProfile />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;