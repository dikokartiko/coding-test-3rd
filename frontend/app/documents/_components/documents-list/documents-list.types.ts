export interface Document {
  id: string;
  file_name: string;
  upload_date: string;
  parsing_status: string;
  fund_id?: number;
  file_size?: number;
  file_type?: string;
  url?: string;
}

export interface DocumentsListProps {
  initialDocuments?: Document[] | null;
  initialError?: Error | null;
}
