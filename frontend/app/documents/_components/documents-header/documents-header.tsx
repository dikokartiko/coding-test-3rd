import Link from "next/link";
import { Upload } from "lucide-react";

export function DocumentsHeader() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold mb-2">Documents</h1>
        <p className="text-gray-600">
          Manage uploaded fund performance reports
        </p>
      </div>
      <Link
        href="/upload"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
      >
        <Upload className="w-4 h-4" />
        <span>Upload New</span>
      </Link>
    </div>
  );
}
