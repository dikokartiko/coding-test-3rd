import type {
  EmptyStateProps,
  IconKey,
  QuestionCardProps,
} from "./empty-state.types";
import { type QuestionCard, questionCards } from "./empty-state.data";
import {
  BarChart3,
  FileText as FileTextIcon,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

const iconMap: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  TrendingUp,
  FileText: FileTextIcon,
  Lightbulb,
};

const renderIcon = (card: QuestionCard) => {
  const Icon = iconMap[card.iconType];
  if (!Icon) {
    return null;
  }
  return <Icon className={card.iconClassName} />;
};

function WelcomeMessage() {
  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Start a conversation
      </h3>
    </div>
  );
}

function QuestionCardButton({ card, index, setInput }: QuestionCardProps) {
  return (
    <button
      key={index}
      onClick={() => setInput(card.question)}
      className={`rounded-2xl border p-4 text-left text-sm text-gray-800 shadow-sm transition-all duration-200 hover:shadow-md ${card.color} group`}
    >
      <div className="flex items-start gap-3">
        <div className="group-hover:scale-110 transition-transform duration-200">
          {renderIcon(card)}
        </div>
        <div className="flex-1">
          <p className="font-medium leading-relaxed">{card.question}</p>
        </div>
      </div>
    </button>
  );
}

/**
 * EmptyState component displayed when there are no messages in the chat
 * Shows a welcome message and suggested question cards to help users get started
 */
export function EmptyState({ setInput }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto max-w-3xl px-4">
        <WelcomeMessage />
        <div className="grid w-full gap-4 md:grid-cols-2">
          {questionCards.map((card, index) => (
            <QuestionCardButton
              key={index}
              card={card}
              index={index}
              setInput={setInput}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
