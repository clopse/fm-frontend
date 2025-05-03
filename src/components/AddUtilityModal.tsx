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
  const [autoParsed, setAutoParsed] = useState<any>(null);

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    setAutoParsed(null);
    if (!f) return;

    const formData = new FormData();
    formData.append("file", f);
    formData.append("hotel_id", hotelId);
    formData.append("utility_type", utilityType);
    formData.append("supplier", supplier);
    formData.append("billing_start", "2024-01-01"); // temporary fallback
    formData.append("billing_end", "2024-01-31");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/parse-and-save`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Auto-parse failed");
      }

      const filename = data.metadata_path || "";
      const json = await fetch(`${filename}`).then((r) => r.json());
      setAutoParsed(json);

      if (json.billing_period) {
        setBillingStart(json.billing_period.startDate || "");
        setBillingEnd(json.billing_period.endDate || "");
      }

    } catch (err: any) {
      console.error("❌ Auto-parse failed:", err);
      alert("Warning: Parser could not auto-fill fields. You can still continue manually.");
    }
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
    formData.append("utility_type", utilityType);
    formData.append("supplier", supplier);
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

        <div className={styles.body}>
          <div className={styles.left}>
            <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
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

            {file && (
              <iframe
                src={URL.createObjectURL(file)}
                style={{ width: "100%", height: "400px", border: "1px solid #ccc", borderRadius: "6px" }}
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
