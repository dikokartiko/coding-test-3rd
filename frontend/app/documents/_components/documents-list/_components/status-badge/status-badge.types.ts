export interface StatusBadgeProps {
  status: string;
}

export interface StatusConfig {
  iconComponent: React.ComponentType<any>;
  iconProps: {
    className: string;
  };
  text: string;
  className: string;
}

export type StatusType = "completed" | "processing" | "pending" | "failed";
