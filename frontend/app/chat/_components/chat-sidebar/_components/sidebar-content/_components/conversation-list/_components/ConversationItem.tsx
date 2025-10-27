import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ConversationItemProps } from "./conversation-item.types";
import {
  getConversationItemClassNames,
  createConversationItemHandlers,
} from "./_utils/conversation-item";

const ConversationTitle = ({ conversation }: { conversation: any }) => (
  <>
    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
      {conversation.title || "Untitled Conversation"}
    </p>
    <p className="text-xs text-gray-400">
      {formatDate(conversation.updated_at)}
    </p>
  </>
);

const renderConversationItemContent = (
  conversation: any,
  isActive: boolean,
  selectClickHandler: () => void,
  deleteClickHandler: (event: React.MouseEvent) => void
) => (
  <>
    <button
      onClick={selectClickHandler}
      className={getConversationItemClassNames(isActive)}
    >
      <div className="flex-1">
        <ConversationTitle conversation={conversation} />
      </div>
      <button
        className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        onClick={deleteClickHandler}
        title="Delete conversation"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </button>
  </>
);

/**
 * Individual conversation item component
 */
export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const { selectClickHandler, deleteClickHandler } =
    createConversationItemHandlers(conversation, onSelect, onDelete);

  return (
    <li>
      {renderConversationItemContent(
        conversation,
        isActive,
        selectClickHandler,
        deleteClickHandler
      )}
    </li>
  );
}
