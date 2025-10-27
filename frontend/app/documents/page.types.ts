/**
 * Type definitions for the documents page
 */

/**
 * Represents a document in the system
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  /** Name of the file */
  file_name: string;
  /** Upload date of the document */
  upload_date: string;
  /** Parsing status of the document */
  parsing_status: "completed" | "processing" | "pending" | "failed";
  /** Optional fund ID associated with the document */
  fund_id?: number;
  /** Size of the file in bytes */
  file_size?: number;
  /** Type of the document */
  file_type?: string;
  /** URL to access the document */
  url?: string;
}

/**
 * Status types for document processing
 */
export type DocumentStatus = "completed" | "processing" | "pending" | "failed";
