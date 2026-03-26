import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './app/Home';
import ArmyBuilder from './app/ArmyBuilder';
import RulesReference from './app/RulesReference';
import TurnTracker from './app/TurnTracker';
import DocumentLibrary from './app/DocumentLibrary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'army-builder', element: <ArmyBuilder /> },
      { path: 'rules', element: <RulesReference /> },
      { path: 'turn-tracker', element: <TurnTracker /> },
      { path: 'documents', element: <DocumentLibrary /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
