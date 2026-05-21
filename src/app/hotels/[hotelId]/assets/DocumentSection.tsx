"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, X, Trash2, Download, Eye } from "lucide-react";

interface DocumentSectionProps {
  assetId: number;
  isEditing: boolean;
}

interface DocumentInfo {
  key: string;
  url: string;
  type: "pdf" | "image";
}

interface Documents {
  manual?: DocumentInfo;
  commissioning?: DocumentInfo;
  warranty?: DocumentInfo;
  photos?: DocumentInfo[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function DocumentSection({ assetId, isEditing }: DocumentSectionProps) {
  const [documents, setDocuments] = useState<Documents>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ type: string; url: string } | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [assetId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/assets/${assetId}/documents`);
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (docType: string, file: File) => {
    try {
      setUploading(docType);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_BASE}/api/assets/${assetId}/upload/${docType}`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      // Reload documents to show new upload
      await loadDocuments();
      
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docType: string, photoIndex?: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const url = photoIndex !== undefined 
        ? `${API_BASE}/api/assets/${assetId}/document/${docType}?photo_index=${photoIndex}`
        : `${API_BASE}/api/assets/${assetId}/document/${docType}`;
      
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      await loadDocuments();
      
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete document");
    }
  };

  const DocumentUploader = ({ 
    label, 
    docType, 
    existingDoc,
    accept = ".pdf"
  }: { 
    label: string; 
    docType: string; 
    existingDoc?: DocumentInfo;
    accept?: string;
  }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {existingDoc && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewingDoc({ type: label, url: existingDoc.url })}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            {isEditing && (
              <button
                onClick={() => handleDelete(docType)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {existingDoc ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded">
          <FileText className="w-4 h-4 text-green-600" />
          <span className="flex-1 truncate">Document uploaded</span>
        </div>
      ) : isEditing ? (
        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <Upload className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {uploading === docType ? "Uploading..." : "Click to upload"}
          </span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading === docType}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(docType, file);
            }}
          />
        </label>
      ) : (
        <div className="text-sm text-gray-400 italic">No document uploaded</div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <DocumentUploader 
          label="O&M Manual"
          docType="manual"
          existingDoc={documents.manual}
          accept=".pdf"
        />
        
        <DocumentUploader 
          label="Commissioning Certificate"
          docType="commissioning"
          existingDoc={documents.commissioning}
          accept=".pdf"
        />
        
        <DocumentUploader 
          label="Warranty Document"
          docType="warranty"
          existingDoc={documents.warranty}
          accept=".pdf"
        />
        
        {/* Photos Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Photos</label>
            {isEditing && (
              <label className="flex items-center gap-2 px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-hover cursor-pointer">
                <Upload className="w-4 h-4" />
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading === "photo"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload("photo", file);
                  }}
                />
              </label>
            )}
          </div>
          
          {documents.photos && documents.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {documents.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Asset photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded flex items-center justify-center gap-2">
                    <button
                      onClick={() => setViewingDoc({ type: `Photo ${index + 1}`, url: photo.url })}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-all"
                      title="View full size"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                    {isEditing && (
                      <button
                        onClick={() => handleDelete("photo", index)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic text-center py-4">
              No photos uploaded
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{viewingDoc.type}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={viewingDoc.url}
                  download
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 min-h-[600px]">
              {viewingDoc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.type}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <iframe
                  src={`${viewingDoc.url}#toolbar=0&navpanes=0&view=FitH`}
                  className="w-full h-full border-0"
                  style={{ minHeight: '800px' }}
                  title={viewingDoc.type}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
