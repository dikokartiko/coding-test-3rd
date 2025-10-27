import { documentApi } from "@/lib/api";
import DocumentsLayout from "./layout";
import { DocumentsList } from "./_components";

export default async function DocumentsPage() {
  // Server-side data fetching
  let initialDocuments = null;
  let error = null;

  try {
    initialDocuments = await documentApi.list();
  } catch (err) {
    error =
      err instanceof Error
        ? err
        : new Error("An error occurred while fetching documents");
  }

  return (
    <DocumentsLayout>
      <DocumentsList initialDocuments={initialDocuments} initialError={error} />
    </DocumentsLayout>
  );
}
