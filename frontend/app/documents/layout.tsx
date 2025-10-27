import { DocumentsList, DocumentsHeader } from "./_components";
import { Document } from "./page.types";

interface DocumentsLayoutProps {
  initialDocuments?: Document[] | null;
  initialError?: Error | null;
}

export default function DocumentsLayout({
  initialDocuments = null,
  initialError = null,
}: DocumentsLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <DocumentsHeader />
      <DocumentsList
        initialDocuments={initialDocuments}
        initialError={initialError}
      />
    </div>
  );
}
