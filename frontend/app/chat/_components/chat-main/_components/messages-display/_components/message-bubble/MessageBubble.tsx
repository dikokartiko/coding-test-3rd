import { cn } from "@/lib/utils";
import {
  MessageBubbleProps,
  MessageContentProps,
  MessageTimestampProps,
  SourceItemProps,
  SourcesListProps,
  SourcesSectionProps,
} from "./message-bubble.types";
import { MetricsPanel } from "./_components";

function MessageContent({ message, isUser }: MessageContentProps) {
  return (
    <div
      className={cn(
        "rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm",
        isUser ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-900"
      )}
    >
      <p className="whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}

function MessageTimestamp({ timestamp }: MessageTimestampProps) {
  return (
    <p className="text-xs text-gray-500 mt-2">
      {(timestamp instanceof Date
        ? timestamp
        : new Date(timestamp)
      ).toLocaleTimeString()}
    </p>
  );
}

function SourceItem({ source, idx }: SourceItemProps) {
  return (
    <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
      <p className="text-gray-700 line-clamp-2">{source.content}</p>
      {source.score && (
        <p className="text-gray-50 mt-1">
          Relevance: {(source.score * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
}

function SourcesList({ sources }: SourcesListProps) {
  return (
    <div className="px-4 py-3 space-y-2 border-t">
      {sources.slice(0, 3).map((source, idx) => (
        <SourceItem key={idx} source={source} idx={idx} />
      ))}
    </div>
  );
}

function SourcesSection({ sources }: SourcesSectionProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3">
      <details className="bg-white border-gray-200 rounded-xl">
        <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
          View Sources ({sources.length})
        </summary>
        <SourcesList sources={sources} />
      </details>
    </div>
  );
}

/**
 * MessageBubble component that displays a single chat message
 * Renders differently for user vs assistant messages and shows optional metrics and sources
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-3xl", isUser ? "ml-12" : "mr-12")}>
        <MessageContent message={message} isUser={isUser} />

        {message.metrics && <MetricsPanel metrics={message.metrics} />}

        <SourcesSection sources={message.sources} />

        <MessageTimestamp timestamp={message.timestamp} />
      </div>
    </div>
  );
}
