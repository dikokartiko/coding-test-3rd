import { DocumentsList, DocumentsHeader } from "./_components";
import { Document } from "./page.types";

interface DocumentsLayoutProps {
  children: React.ReactNode;
}

export default function DocumentsLayout({ children }: DocumentsLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <DocumentsHeader />
      {children}
    </div>
  );
}
