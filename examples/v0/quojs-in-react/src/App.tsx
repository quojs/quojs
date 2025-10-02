import { createBrowserRouter, RouterProvider } from "react-router";

import { StoreProvider as DuxProvider } from "@quojs/react";
import { store as duxStore } from "./state/quojs";
import { QuojsTodoPage } from "./components/quojs/QuojsTodoPage";

import { Provider as RtkProvider } from "react-redux";
import { store as rtkStore } from "./state/redux";
import { ReduxTodoPage } from "./components/redux/ReduxTodoPage";
import { Layout } from "./components/layout/Layout.component";
import { Home } from "./pages/Home.page";

function DuxRoute() {
  return (
    <DuxProvider store={duxStore}>
      <QuojsTodoPage />
    </DuxProvider>
  );
}

function RtkRoute() {
  return (
    <RtkProvider store={rtkStore}>
      <ReduxTodoPage />
    </RtkProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/quojs", element: <DuxRoute /> },
      { path: "/redux", element: <RtkRoute /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
