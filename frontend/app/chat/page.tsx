"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Loader2,
  FileText,
  Plus,
  Trash2,
  RefreshCcw,
  MessageSquare,
  TrendingUp,
  FileText as FileTextIcon,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { chatApi, fundApi } from "@/lib/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  metrics?: any;
  timestamp: Date;
}

interface ConversationSummary {
  conversation_id: string;
  fund_id?: number;
  title?: string;
  last_message?: string;
  updated_at: string;
}

interface FundOption {
  id: number;
  name: string;
}

const MAX_COMPARISON_FUNDS = 4;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fundOptions, setFundOptions] = useState<FundOption[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<number | undefined>();
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [comparisonPicker, setComparisonPicker] = useState<number | "">("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setSidebarLoading(true);
    try {
      const list = await chatApi.listConversations();
      setConversations(list);
    } catch (error) {
      console.error(error);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    fundApi
      .list()
      .then((data) => {
        const options = data.map((fund: any) => ({
          id: fund.id,
          name: fund.name,
        }));
        setFundOptions(options);
        if (options.length && !selectedFundId) {
          setSelectedFundId(options[0].id);
        }
      })
      .catch((error) => console.error(error));
  }, [selectedFundId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!conversationId && conversations.length > 0) {
      setConversationId(conversations[0].conversation_id);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!conversationId) return;
    setHistoryLoading(true);
    chatApi
      .getConversation(conversationId)
      .then((conversation) => {
        setMessages(deserializeMessages(conversation.messages ?? []));
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(
          error?.response?.data?.detail || "Unable to load conversation"
        );
      })
      .finally(() => setHistoryLoading(false));
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, loading]);

  const startConversation = useCallback(async () => {
    const conversation = await chatApi.createConversation(selectedFundId);
    setConversationId(conversation.conversation_id);
    setMessages([]);
    loadConversations();
    return conversation.conversation_id;
  }, [loadConversations, selectedFundId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setErrorMessage(null);
    setLoading(true);
    let activeConversationId = conversationId;
    try {
      if (!activeConversationId) {
        activeConversationId = await startConversation();
      }

      const userMessage: Message = {
        role: "user",
        content: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const comparisonPayload =
        comparisonIds.length > 1 ? comparisonIds : undefined;
      const resolvedFundId = selectedFundId ?? comparisonIds[0];

      const response = await chatApi.query(
        userMessage.content,
        resolvedFundId,
        activeConversationId,
        comparisonPayload
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        metrics: response.metrics,
        timestamp: new Date(),
      };

      setConversationId(response.conversation_id || activeConversationId);
      setMessages((prev) => [...prev, assistantMessage]);
      loadConversations();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.detail || error.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${
            error?.response?.data?.detail || error.message
          }`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = async (id: string) => {
    if (id === conversationId) return;
    setHistoryLoading(true);
    try {
      const conversation = await chatApi.getConversation(id);
      setConversationId(id);
      setMessages(deserializeMessages(conversation.messages ?? []));
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.detail || "Unable to load conversation"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await chatApi.deleteConversation(id);
    if (id === conversationId) {
      setConversationId(undefined);
      setMessages([]);
    }
    loadConversations();
  };

  const handleAddComparison = () => {
    if (!comparisonPicker || comparisonIds.includes(comparisonPicker)) return;
    if (comparisonIds.length >= MAX_COMPARISON_FUNDS) return;
    setComparisonIds((prev) => [...prev, Number(comparisonPicker)]);
    setComparisonPicker("");
  };

  const handleRemoveComparison = (fundId: number) => {
    setComparisonIds((prev) => prev.filter((id) => id !== fundId));
  };

  const fundName = useCallback(
    (fundId?: number) => fundOptions.find((fund) => fund.id === fundId)?.name,
    [fundOptions]
  );

  const activeConversation = conversations.find(
    (conv) => conv.conversation_id === conversationId
  );

  const conversationTitle =
    activeConversation?.title || "Untitled Conversation";

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-2xl border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">History</p>
            <p className="text-xs text-gray-500">Resume past analyses</p>
          </div>
          <button
            onClick={startConversation}
            className="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100vh-14rem)] overflow-y-auto">
          {sidebarLoading ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No conversations yet. Start a new chat to begin tracking history.
            </div>
          ) : (
            <ul className="divide-y">
              {conversations.map((conversation) => (
                <li key={conversation.conversation_id}>
                  <button
                    onClick={() =>
                      handleConversationSelect(conversation.conversation_id)
                    }
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50/70",
                      conversationId === conversation.conversation_id &&
                        "bg-blue-50"
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {conversation.title || "Untitled Conversation"}
                      </p>
                      {conversation.last_message && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {conversation.last_message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(conversation.updated_at)}
                      </p>
                    </div>
                    <button
                      className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteConversation(conversation.conversation_id);
                      }}
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section
        className="flex h-[calc(100vh-14rem)] flex-col rounded-2xl border border-gray-100 bg-white shadow-sm"
        style={{ minHeight: "-webkit-fill-available" }}
      >
        <header className="border-b px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Fund analysis chat
          </p>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              {conversationTitle}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {fundName(selectedFundId)
              ? `Focused on ${fundName(selectedFundId)}`
              : "All funds"}
          </p>
        </header>

        <div className="grid gap-4 border-b px-6 py-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600">
              Primary fund context
            </label>
            <select
              value={selectedFundId ?? ""}
              onChange={(event) =>
                setSelectedFundId(
                  event.target.value ? Number(event.target.value) : undefined
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All funds</option>
              {fundOptions.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Used for fund-specific calculations like DPI or IRR.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Compare multiple funds
            </label>
            <div className="mt-1 flex gap-2">
              <select
                value={comparisonPicker}
                onChange={(event) =>
                  setComparisonPicker(
                    event.target.value ? Number(event.target.value) : ""
                  )
                }
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select fund</option>
                {fundOptions.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddComparison}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                disabled={!comparisonPicker}
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {comparisonIds.map((fundId) => (
                <span
                  key={fundId}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {fundName(fundId)}
                  <button
                    onClick={() => handleRemoveComparison(fundId)}
                    className="text-blue-500 hover:text-blue-700"
                    aria-label={`Remove ${fundName(fundId)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Add up to {MAX_COMPARISON_FUNDS} funds. The assistant will compare
              them when relevant.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {historyLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Loading conversation...
              </div>
            )}

            {!historyLoading && messages.length === 0 && (
              <EmptyState setInput={setInput} />
            )}

            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t p-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 lg:flex-row lg:items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about fund performance..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-30"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ setInput }: { setInput: (value: string) => void }) {
  const questionCards = [
    {
      question: "What is the latest DPI for the selected fund?",
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      color:
        "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
    },
    {
      question: "Compare DPI and IRR for Horizon Fund and Apollo Fund",
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      color:
        "bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300",
    },
    {
      question: "Summarize capital calls made since 2022",
      icon: <FileTextIcon className="h-6 w-6 text-purple-600" />,
      color:
        "bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300",
    },
    {
      question: "Explain what Paid-In Capital represents",
      icon: <Lightbulb className="h-6 w-6 text-amber-600" />,
      color:
        "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300",
    },
  ];

  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Start a conversation
          </h3>
        </div>
        <div className="grid w-full gap-4 md:grid-cols-2">
          {questionCards.map((card, index) => (
            <button
              key={index}
              onClick={() => setInput(card.question)}
              className={`rounded-2xl border p-4 text-left text-sm text-gray-800 shadow-sm transition-all duration-200 hover:shadow-md ${card.color} group`}
            >
              <div className="flex items-start gap-3">
                <div className="group-hover:scale-110 transition-transform duration-200">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{card.question}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-3xl", isUser ? "ml-12" : "mr-12")}>
        <div
          className={cn(
            "rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm",
            isUser ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-900"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.metrics && <MetricsPanel metrics={message.metrics} />}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <details className="bg-white border-gray-200 rounded-xl">
              <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                View Sources ({message.sources.length})
              </summary>
              <div className="px-4 py-3 space-y-2 border-t">
                {message.sources.slice(0, 3).map((source, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                    <p className="text-gray-700 line-clamp-2">
                      {source.content}
                    </p>
                    {source.score && (
                      <p className="text-gray-500 mt-1">
                        Relevance: {(source.score * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: Record<string, any> }) {
  const baseMetrics = Object.entries(metrics).filter(
    ([key, value]) =>
      key !== "comparison" && value !== null && typeof value !== "object"
  );
  const comparison = metrics?.comparison;
  const customMetrics = metrics?.custom_metrics;

  return (
    <div className="mt-3 space-y-3">
      {baseMetrics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            Calculated Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {baseMetrics.map(([key, value]) => (
              <div key={key} className="text-gray-800">
                <span className="text-gray-500 uppercase text-xs">{key}</span>
                <div className="font-semibold">
                  {typeof value === "number"
                    ? key.toLowerCase().includes("irr")
                      ? `${value.toFixed(2)}%`
                      : formatCurrency(value)
                    : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {customMetrics && Object.keys(customMetrics).length > 0 && (
        <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
          <h4 className="text-sm font-semibold text-purple-900 mb-2">
            Custom Formulas
          </h4>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {Object.entries(customMetrics).map(([name, value]) => (
              <div key={name}>
                <p className="text-xs uppercase text-purple-700">{name}</p>
                <p className="font-semibold text-gray-900">
                  {typeof value === "number"
                    ? value.toFixed(2)
                    : typeof value === "string"
                    ? value
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(comparison) && comparison.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Comparison Snapshot
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-blue-800">
                  <th className="py-2 pr-4">Fund</th>
                  <th className="py-2 pr-4">DPI</th>
                  <th className="py-2 pr-4">IRR</th>
                  <th className="py-2 pr-4">PIC</th>
                  <th className="py-2">Distributions</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((entry: any) => (
                  <tr key={entry.fund_id} className="border-t border-blue-100">
                    <td className="py-2 pr-4 font-semibold text-blue-900">
                      {entry.fund_name || `Fund ${entry.fund_id}`}
                    </td>
                    <td className="py-2 pr-4">
                      {formatNumeric(entry.metrics?.dpi, "ratio")}
                    </td>
                    <td className="py-2 pr-4">
                      {formatNumeric(entry.metrics?.irr, "percent")}
                    </td>
                    <td className="py-2 pr-4">
                      {formatNumeric(entry.metrics?.pic)}
                    </td>
                    <td className="py-2">
                      {formatNumeric(entry.metrics?.total_distributions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumeric(
  value?: number | null,
  mode: "currency" | "percent" | "ratio" = "currency"
) {
  if (value === undefined || value === null) return "—";
  if (mode === "percent") return `${Number(value).toFixed(2)}%`;
  if (mode === "ratio") return `${Number(value).toFixed(2)}x`;
  return formatCurrency(Number(value));
}

function deserializeMessages(data: any[]): Message[] {
  return data.map((item) => ({
    role: item.role,
    content: item.content,
    sources: item.metadata?.sources,
    metrics: item.metrics,
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
  }));
}
