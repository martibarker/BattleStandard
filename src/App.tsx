import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import Layout from './components/Layout';
import Home from './app/Home';
import ArmyBuilder from './app/ArmyBuilder';
import NewArmy from './app/NewArmy';
import ArmyEditor from './app/ArmyEditor';
import RulesReference from './app/RulesReference';
import TurnTracker from './app/TurnTracker';
import DocumentLibrary from './app/DocumentLibrary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <Sentry.ErrorBoundary fallback={<p style={{ padding: '2rem', color: '#f87171' }}>Something went wrong. Please refresh the page.</p>} />,
    children: [
      { index: true, element: <Home /> },
      { path: 'army-builder', element: <ArmyBuilder /> },
      { path: 'army-builder/new', element: <NewArmy /> },
      { path: 'army-builder/:id', element: <ArmyEditor /> },
      { path: 'rules', element: <RulesReference /> },
      { path: 'turn-tracker', element: <TurnTracker /> },
      { path: 'documents', element: <DocumentLibrary /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
