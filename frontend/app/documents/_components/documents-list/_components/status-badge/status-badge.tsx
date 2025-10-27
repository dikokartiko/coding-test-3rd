import { StatusBadgeProps } from "./status-badge.types";
import { statusConfig } from "./status-badge.data";

export function StatusBadge({ status }: StatusBadgeProps) {
  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  const IconComponent = config.iconComponent;

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <IconComponent {...config.iconProps} />
      <span>{config.text}</span>
    </span>
  );
}
