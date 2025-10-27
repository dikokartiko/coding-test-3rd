"use client";

import { useForm } from "react-hook-form";
import { Loader2, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormulaFormData, FormulaFormProps } from "./formula-form.types";

const AVAILABLE_VARIABLES = ["pic", "dpi", "irr", "total_distributions"];

export function FormulaForm({
  onFormSubmit,
  editingFormula = null,
  onCancelEdit,
}: FormulaFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm<FormulaFormData>({
    defaultValues: {
      name: editingFormula?.name || "",
      expression: editingFormula?.expression || "",
      description: editingFormula?.description || "",
      variables:
        editingFormula?.variables?.map((v: any) => v.name).join(", ") || "",
      tags: editingFormula?.tags?.join(", ") || "",
      visibility: editingFormula?.visibility || "private",
    },
  });

  const onSubmit = async (values: FormulaFormData) => {
    await onFormSubmit(values);
    if (!editingFormula) {
      reset();
    }
  };

  const handleCancel = () => {
    reset();
    onCancelEdit?.();
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingFormula ? "Edit formula" : "Create formula"}
        </h2>
        {editingFormula && onCancelEdit && (
          <button
            onClick={handleCancel}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Cancel edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            {...register("name", { required: true })}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Net DPI excl. fees"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Expression
          </label>
          <textarea
            {...register("expression", { required: true })}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={3}
            placeholder="(total_distributions - fees) / pic"
            required
          />
          <p className="text-xs text-gray-500">
            Use basic math operators (+, -, *, /) and functions like abs(),
            min(), max(), round().
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register("description")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={2}
            placeholder="Explain what this KPI represents"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Variables</label>
          <input
            {...register("variables")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="pic, total_distributions"
          />
          <p className="text-xs text-gray-500">
            Optional metadata. Separate values with commas for documentation.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <input
            {...register("tags")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="returns, compliance"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Visibility
          </label>
          <select
            {...register("visibility")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="private">Private</option>
            <option value="org">Organization</option>
            <option value="global">Global</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-30"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingFormula ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingFormula ? "Update formula" : "Create formula"}
          </button>
          {editingFormula && onCancelEdit && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-70 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
        Available variables:{" "}
        {AVAILABLE_VARIABLES.map((variable) => (
          <code key={variable} className="mx-1 rounded bg-gray-100 px-2 py-0.5">
            {variable}
          </code>
        ))}
      </div>
    </section>
  );
}
