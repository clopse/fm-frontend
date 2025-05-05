'use client';

import { useState, useEffect } from "react";
import styles from "@/styles/AddUtilityModal.module.css";

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function AddUtilityModal({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");// This is the status message for polling results
  const [attempts, setAttempts] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setMessage("");
    setStatus("");
  };

  const pollForParsedData = async (jobId: string) => {
    const maxAttempts = 10;
    setAttempts(0); // reset attempts

    const fetchJobStatus = async () => {
      if (attempts >= maxAttempts) {
        setStatus("❌ Parsing timed out. Please try again.");
        return;
      }

      try {
        const res = await fetch(`/api/utilities/${hotelId}/2025`);
        if (!res.ok) {
          throw new Error("No result available yet.");
        }

        const data = await res.json();
        if (data.status === "completed") {
          setStatus("✅ Parsing completed successfully.");
          return;
        } else {
          setAttempts(prev => prev + 1);
          setStatus(`⏳ Still processing, attempt #${attempts + 1}`);
          setTimeout(fetchJobStatus, Math.min(1000 * Math.pow(2, attempts), 60000)); // Exponential backoff
        }
      } catch (err) {
        console.error(err);
        setStatus(`❌ Error checking status: ${err.message}`);
      }
    };

    fetchJobStatus();
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    setUploading(true);
    setMessage("");
    setStatus("⏳ Uploading bill...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("hotel_id", hotelId);
    formData.append("supplier", "docupanda");
    formData.append("utility_type", "auto");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/parse-and-save`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }

      const { jobId, documentId } = await res.json();
      setStatus("✅ File uploaded successfully. Processing in the background...");
      setTimeout(() => {
        pollForParsedData(jobId); // Start polling for document processing
      }, 2000); // Delay before starting polling

      onSave?.();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Upload Utility Bill</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          {file && <p>📄 {file.name}</p>}
          {message && <p>{message}</p>}
          {status && <p>{status}</p>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.uploadButton}
            onClick={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
