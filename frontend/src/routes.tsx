import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@components/UI/LoadingScreen';
import { Layout } from '@components/Layout/Layout';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@components/Pages/HomePage'));
const SimulationPage = lazy(() => import('@components/Pages/SimulationPage'));
const SimulationsListPage = lazy(() => import('@components/Pages/SimulationsListPage'));
const BlueprintPage = lazy(() => import('@components/Pages/BlueprintPage'));
const BlueprintsGallery = lazy(() => import('@components/Pages/BlueprintsGallery'));
const ChallengesPage = lazy(() => import('@components/Pages/ChallengesPage'));
const ChallengePage = lazy(() => import('@components/Pages/ChallengePage'));
const DashboardPage = lazy(() => import('@components/Pages/DashboardPage'));
const PricingPage = lazy(() => import('@components/Pages/PricingPage'));
const NotFoundPage = lazy(() => import('@components/Pages/NotFoundPage'));
const AdminDashboard = lazy(() => import('@components/Admin/AdminDashboard'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<LoadingScreen />}>
              <HomePage />
            </Suspense>
          }
        />

        <Route
          path="simulations"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <SimulationsListPage />
            </Suspense>
          }
        />

        <Route
          path="simulations/:id"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <SimulationPage />
            </Suspense>
          }
        />

        <Route
          path="blueprints"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <BlueprintsGallery />
            </Suspense>
          }
        />

        <Route
          path="blueprints/:id"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <BlueprintPage />
            </Suspense>
          }
        />

        <Route
          path="challenges"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <ChallengesPage />
            </Suspense>
          }
        />

        <Route
          path="challenges/:id"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <ChallengePage />
            </Suspense>
          }
        />

        <Route
          path="dashboard"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <DashboardPage />
            </Suspense>
          }
        />

        <Route
          path="pricing"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <PricingPage />
            </Suspense>
          }
        />

        <Route
          path="admin"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminDashboard />
            </Suspense>
          }
        />

        <Route
          path="*"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
