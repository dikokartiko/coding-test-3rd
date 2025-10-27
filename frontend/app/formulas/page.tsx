import { formulaApi } from "@/lib/api";
import FormulasLayout from "./layout";

export default async function FormulasPage() {
  // Server-side data fetching
  let initialFormulas = null;
  let error = null;

  try {
    initialFormulas = await formulaApi.list();
  } catch (err) {
    error =
      err instanceof Error
        ? err
        : new Error("An error occurred while fetching formulas");
  }

  return (
    <>
      <FormulasLayout
        initialFormulas={initialFormulas}
        initialError={error}
      ></FormulasLayout>
    </>
  );
}
