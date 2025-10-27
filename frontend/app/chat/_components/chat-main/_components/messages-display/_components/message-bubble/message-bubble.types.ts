import { Message } from "../../../../../../page.types";

/**
 * Props for the MessageBubble component
 */
export interface MessageBubbleProps {
  /** The message object to display, containing content, role, and metadata */
  message: Message;
}

/**
 * Props for the MessageContent component
 */
export interface MessageContentProps {
  message: Message;
  isUser: boolean;
}

/**
 * Props for the MessageTimestamp component
 */
export interface MessageTimestampProps {
  timestamp: Date | string;
}

/**
 * Props for the SourceItem component
 */
export interface SourceItemProps {
  source: any;
  idx: number;
}

/**
 * Props for the SourcesList component
 */
export interface SourcesListProps {
  sources: any[];
}

/**
 * Props for the SourcesSection component
 */
export interface SourcesSectionProps {
  sources: any[] | undefined;
}
