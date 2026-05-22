import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <Toaster position="top-left" />
      <RouterProvider router={router} />
    </>
  );
}
