'use client';

import { useState } from "react";
import styles from "@/styles/AddUtilityModal.module.css";

interface ParsedData {
  billing_start: string;
  billing_end: string;
  total_kwh: number;
  total_eur: number;
  day_kwh?: number;
  night_kwh?: number;
  subtotal_eur?: number;
  confidence_score?: number;
}

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function AddUtilityModal({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [utilityType, setUtilityType] = useState("gas");
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const formData = new FormData();
    formData.append("file", selected);

    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/parse-pdf`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setParsed(data);
    setLoading(false);
  };

  const handleChange = (field: keyof ParsedData, value: string | number) => {
    setParsed((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSubmit = async () => {
    if (!file || !parsed) return;

    const formData = new FormData();
    formData.append("hotel_id", hotelId);
    formData.append("utility_type", utilityType);
    formData.append("billing_start", parsed.billing_start);
    formData.append("billing_end", parsed.billing_end);
    formData.append("total_kwh", String(parsed.total_kwh));
    formData.append("total_eur", String(parsed.total_eur));
    formData.append("day_kwh", String(parsed.day_kwh ?? ""));
    formData.append("night_kwh", String(parsed.night_kwh ?? ""));
    formData.append("subtotal_eur", String(parsed.subtotal_eur ?? ""));
    formData.append("confidence_score", String(parsed.confidence_score ?? ""));
    formData.append("file", file);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/save-corrected`, {
      method: "POST",
      body: formData,
    });

    if (res.ok && onSave) onSave();
    onClose();
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
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <select value={utilityType} onChange={(e) => setUtilityType(e.target.value)}>
              <option value="gas">Gas</option>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
            </select>
            {file && (
              <iframe src={URL.createObjectURL(file)} width="100%" height="400px" />
            )}
          </div>

          <div className={styles.right}>
            {loading && <p>Parsing PDF...</p>}
            {parsed && (
              <>
                <label>Billing Start</label>
                <input value={parsed.billing_start} onChange={(e) => handleChange("billing_start", e.target.value)} />
                <label>Billing End</label>
                <input value={parsed.billing_end} onChange={(e) => handleChange("billing_end", e.target.value)} />
                <label>Total kWh</label>
                <input type="number" value={parsed.total_kwh} onChange={(e) => handleChange("total_kwh", Number(e.target.value))} />
                <label>Total €</label>
                <input type="number" value={parsed.total_eur} onChange={(e) => handleChange("total_eur", Number(e.target.value))} />
                <label>Day kWh</label>
                <input type="number" value={parsed.day_kwh ?? ""} onChange={(e) => handleChange("day_kwh", Number(e.target.value))} />
                <label>Night kWh</label>
                <input type="number" value={parsed.night_kwh ?? ""} onChange={(e) => handleChange("night_kwh", Number(e.target.value))} />
                <label>Subtotal €</label>
                <input type="number" value={parsed.subtotal_eur ?? ""} onChange={(e) => handleChange("subtotal_eur", Number(e.target.value))} />
              </>
            )}
          </div>
        </div>

        <div className={sty
