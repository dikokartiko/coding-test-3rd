import { Message } from "../../../page.types";

/**
 * Deserializes message data from the API into Message objects
 * @param data - Array of message data objects from the API
 * @returns Array of formatted Message objects with proper types
 */
export function deserializeMessages(data: any[]): Message[] {
  return data.map((item) => ({
    role: item.role,
    content: item.content,
    sources: item.metadata?.sources,
    metrics: item.metrics,
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
  }));
}
