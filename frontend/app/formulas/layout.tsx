import { FormulasList } from "./_components";
import { Formula } from "./page.types";

interface FormulasLayoutProps {
  initialFormulas?: Formula[] | null;
  initialError?: Error | null;
}

export default function FormulasLayout({
  initialFormulas = null,
  initialError = null,
}: FormulasLayoutProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Custom metrics
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Formula builder</h1>
        <p className="text-gray-600">
          Define reusable KPIs using variables like PIC, DPI, and IRR. Formulas
          are evaluated on every fund.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-gray-30 p-4 text-sm text-gray-600">
          Available variables:{" "}
          {["pic", "dpi", "irr", "total_distributions"].map((variable) => (
            <code
              key={variable}
              className="mx-1 rounded bg-gray-100 px-2 py-0.5"
            >
              {variable}
            </code>
          ))}
        </div>
      </header>
      <FormulasList
        initialFormulas={initialFormulas}
        initialError={initialError}
      />
    </div>
  );
}
