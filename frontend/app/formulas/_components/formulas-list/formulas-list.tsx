"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FormulaForm } from "./_components/formula-form/formula-form";
import { FormulaItem } from "./_components/formula-item/formula-item";
import { FormulaListProps } from "./formulas-list.types";
import { Formula, FormulaFormData } from "@/app/formulas/page.types";
import { useFormulas } from "@/app/formulas/_hooks/useFormulas";

export function FormulasList({
  initialFormulas = null,
  initialError = null,
}: FormulaListProps) {
  // Use the hook for client-side data fetching, but with initial data if available
  const {
    data: formulas,
    isLoading,
    error,
    create,
    update,
    delete: deleteFormula,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFormulas({
    enabled: !initialFormulas && !initialError,
  });

  // Use server-side data if available, otherwise use client-side data
  const displayFormulas = initialFormulas || formulas;
  const displayError = initialError || error;
  const displayLoading = isLoading && !initialFormulas;

  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);

  const handleFormSubmit = async (formData: FormulaFormData) => {
    const payload = {
      ...formData,
      variables: (formData.variables || "")
        .split(",")
        .map((variable) => variable.trim())
        .filter(Boolean)
        .map((variable) => ({ name: variable })),
      tags: (formData.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (editingFormula) {
      await update({ id: editingFormula.id, data: payload });
      setEditingFormula(null);
    } else {
      await create(payload);
    }
  };

  const handleEdit = (formula: Formula) => {
    setEditingFormula(formula);
  };

  const handleDelete = async (formulaId: number) => {
    await deleteFormula(formulaId);
    if (editingFormula?.id === formulaId) {
      setEditingFormula(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingFormula(null);
  };

  if (displayLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Error loading formulas: {displayError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      <FormulaForm
        onFormSubmit={handleFormSubmit}
        editingFormula={editingFormula}
        onCancelEdit={handleCancelEdit}
      />
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Saved formulas</h2>
        {displayFormulas && displayFormulas.length === 0 ? (
          <p className="text-sm text-gray-500">No custom formulas yet.</p>
        ) : (
          <ul className="space-y-4 mt-4">
            {displayFormulas?.map((formula: Formula) => (
              <FormulaItem
                key={formula.id}
                formula={formula}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isSelected={editingFormula?.id === formula.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
