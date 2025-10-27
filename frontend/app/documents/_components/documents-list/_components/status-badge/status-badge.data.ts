import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { StatusConfig } from "./status-badge.types";

export const statusConfig: Record<string, StatusConfig> = {
  completed: {
    iconComponent: CheckCircle,
    iconProps: {
      className: "w-4 h-4",
    },
    text: "Completed",
    className: "bg-green-100 text-green-800",
  },
  processing: {
    iconComponent: Loader2,
    iconProps: {
      className: "w-4 h-4 animate-spin",
    },
    text: "Processing",
    className: "bg-blue-100 text-blue-800",
  },
  pending: {
    iconComponent: Loader2,
    iconProps: {
      className: "w-4 h-4",
    },
    text: "Pending",
    className: "bg-yellow-100 text-yellow-800",
  },
  failed: {
    iconComponent: XCircle,
    iconProps: {
      className: "w-4 h-4",
    },
    text: "Failed",
    className: "bg-red-100 text-red-800",
  },
};
