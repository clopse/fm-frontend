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
  const [utilityType, setUtilityType] = useState("electricity");
  const [supplier, setSupplier] = useState("arden");
  const [billingStart, setBillingStart] = useState("");
  const [billingEnd, setBillingEnd] = useState("");
  const [uploading, setUploading] = useState(false);

  const autoParse = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/parse-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Auto-parse result:", data);
        setBillingStart(data.billing_start || "");
        setBillingEnd(data.billing_end || "");
        // Future: auto-set supplier and type based on detection if needed
      } else {
        console.error("❌ Auto-parse failed:", data.detail);
      }
    } catch (err) {
      console.error("❌ Auto-parse error:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) autoParse(selected);
  };

  const handleSubmit = async () => {
    if (!file || !billingStart || !billingEnd) {
      alert("Please fill in all required fields.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("hotel_id", hotelId);
    formData.append("utility_type", utilityType.toLowerCase());
    formData.append("supplier", supplier.toLowerCase());
    formData.append("billing_start", billingStart);
    formData.append("billing_end", billingEnd);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/parse-and-save`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      alert("✅ Utility bill uploaded and parsed successfully!");
      onSave?.();
      onClose();
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      alert("Upload failed: " + err.message);
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

        <div className={styles.body} style={{ display: "flex", gap: "2rem" }}>
          {/* Left: form */}
          <div style={{ flex: 1 }}>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <select value={utilityType} onChange={(e) => setUtilityType(e.target.value)}>
              <option value="electricity">Electricity</option>
              <option value="gas">Gas</option>
            </select>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="arden">Arden</option>
              <option value="flogas">FloGas</option>
            </select>
            <label>Billing Start</label>
            <input type="date" value={billingStart} onChange={(e) => setBillingStart(e.target.value)} />
            <label>Billing End</label>
            <input type="date" value={billingEnd} onChange={(e) => setBillingEnd(e.target.value)} />
          </div>

          {/* Right: preview */}
          <div style={{ flex: 1 }}>
            {file && (
              <iframe
                src={URL.createObjectURL(file)}
                style={{ width: "100%", height: "500px", border: "1px solid #ccc", borderRadius: "6px" }}
              />
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
