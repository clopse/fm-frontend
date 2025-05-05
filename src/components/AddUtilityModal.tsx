'use client';

import { useState } from "react";
import styles from "@/styles/AddUtilityModal.module.css";

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function AddUtilityModal({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setStatus("");
  };

  const pollForParsedData = async (jobId: string) => {
    const maxAttempts = 20;

    const poll = async (attempt: number) => {
      if (attempt >= maxAttempts) {
        setStatus("❌ Parsing timed out. Please try again later.");
        return;
      }

      try {
        const res = await fetch(`/api/utilities/status/${jobId}`);
        if (!res.ok) throw new Error("Status not ready yet.");

        const data = await res.json();
        if (data.status === "completed") {
          setStatus("✅ Parsing completed successfully.");
          onSave?.();
          setTimeout(onClose, 2000);
          return;
        } else {
          setStatus(`⏳ Still processing... attempt #${attempt + 1}`);
          const delay = Math.min(2000 * Math.pow(1.5, attempt), 30000);
          setTimeout(() => poll(attempt + 1), delay);
        }
      } catch (err: any) {
        console.error(err);
        setStatus(`❌ Error: ${err.message}`);
        const delay = 5000;
        setTimeout(() => poll(attempt + 1), delay);
      }
    };

    poll(0);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    setUploading(true);
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

      const { jobId } = await res.json();

      setStatus("✅ File uploaded successfully. Your dashboard will update shortly.");
      setTimeout(() => {
        pollForParsedData(jobId); // Begin polling after delay
      }, 3000); // Optional short delay before first poll

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
