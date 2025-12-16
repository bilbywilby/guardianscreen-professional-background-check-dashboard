import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardHome } from '@/pages/DashboardHome';
import { InvestigationPage } from '@/pages/InvestigationPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsVault } from '@/pages/SettingsVault';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "investigation", element: <InvestigationPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "settings", element: <SettingsVault /> },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);