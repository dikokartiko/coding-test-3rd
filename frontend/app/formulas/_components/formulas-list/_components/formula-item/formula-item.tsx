"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Formula } from "@/app/formulas/page.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FormulaItemProps {
  formula: Formula;
  onEdit: (formula: Formula) => void;
  onDelete: (formulaId: number) => void;
  isSelected?: boolean;
}

export function FormulaItem({
  formula,
  onEdit,
  onDelete,
  isSelected = false,
}: FormulaItemProps) {
  const handleDelete = () => {
    onDelete(formula.id);
  };

  return (
    <li
      key={formula.id}
      className={cn(
        "rounded-2xl border border-gray-100 p-4 transition hover:border-gray-200",
        isSelected && "border-blue-200 bg-blue-50/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{formula.name}</p>
          <p className="text-xs text-gray-500">
            Visibility: {formula.visibility || "private"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(formula)}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-70 transition hover:bg-gray-50"
          >
            Edit
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {`This action cannot be undone. This will permanently delete the formula "${formula.name}" and remove it from all calculations.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {formula.description && (
        <p className="mt-2 text-sm text-gray-600">{formula.description}</p>
      )}
      <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm font-mono text-gray-800">
        {formula.expression}
      </div>
      {formula.tags && formula.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {formula.tags.map((tag) => (
            <span
              key={`${formula.id}-${tag}`}
              className="rounded-full bg-gray-10 px-2 py-0.5 text-xs text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}
