export interface QuestionCard {
  question: string;
  iconType: "BarChart3" | "TrendingUp" | "FileText" | "Lightbulb";
  iconClassName: string;
  color: string;
}

/**
 * Predefined question cards with icon types and styling to guide users
 */
export const questionCards: QuestionCard[] = [
  {
    question: "What is the latest DPI for the selected fund?",
    iconType: "BarChart3",
    iconClassName: "h-6 w-6 text-blue-600",
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
  },
  {
    question: "Compare DPI and IRR for Horizon Fund and Apollo Fund",
    iconType: "TrendingUp",
    iconClassName: "h-6 w-6 text-green-600",
    color:
      "bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300",
  },
  {
    question: "Summarize capital calls made since 2022",
    iconType: "FileText",
    iconClassName: "h-6 w-6 text-purple-600",
    color:
      "bg-purple-50 hover:bg-purple-10 border-purple-200 hover:border-purple-300",
  },
  {
    question: "Explain what Paid-In Capital represents",
    iconType: "Lightbulb",
    iconClassName: "h-6 w-6 text-amber-600",
    color:
      "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300",
  },
];
