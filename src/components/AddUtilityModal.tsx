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
  const [billingStart, setBillingStart] = useState("");
  const [billingEnd, setBillingEnd] = useState("");
  const [dayKWh, setDayKWh] = useState("");
  const [nightKWh, setNightKWh] = useState("");
  const [mic, setMIC] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [nightRate, setNightRate] = useState("");
  const [dayTotal, setDayTotal] = useState("");
  const [nightTotal, setNightTotal] = useState("");
  const [capacityCharge, setCapacityCharge] = useState("");
  const [psoLevy, setPSOLevy] = useState("");
  const [electricityTax, setElectricityTax] = useState("");
  const [vat, setVAT] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [uploading, setUploading] = useState(false);

  const autoParse = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/parse-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Auto-parse result:", data);
        setBillingStart(data.billing_start || "");
        setBillingEnd(data.billing_end || "");
        setDayKWh(data.day_kwh || "");
        setNightKWh(data.night_kwh || "");
        setDayRate(data.day_rate || "");
        setNightRate(data.night_rate || "");
        setDayTotal(data.day_total || "");
        setNightTotal(data.night_total || "");
        setMIC(data.mic || "");
        setCapacityCharge(data.capacity_charge || "");
        setPSOLevy(data.pso_levy || "");
        setElectricityTax(data.electricity_tax || "");
        setVAT(data.vat || "");
        setTotalAmount(data.total_amount || "");
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
    formData.append("utility_type", "electricity");
    formData.append("supplier", "arden");
    formData.append("billing_start", billingStart);
    formData.append("billing_end", billingEnd);
    formData.append("day_kwh", dayKWh);
    formData.append("night_kwh", nightKWh);
    formData.append("mic", mic);
    formData.append("day_rate", dayRate);
    formData.append("night_rate", nightRate);
    formData.append("day_total", dayTotal);
    formData.append("night_total", nightTotal);
    formData.append("capacity_charge", capacityCharge);
    formData.append("pso_levy", psoLevy);
    formData.append("electricity_tax", electricityTax);
    formData.append("vat", vat);
    formData.append("total_amount", totalAmount);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/parse-and-save`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

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
          {/* Left: PDF viewer */}
          <div className={styles.left}>
            {file ? (
              <iframe
                src={URL.createObjectURL(file)}
                className={styles.pdfPreview}
              />
            ) : (
              <input type="file" accept="application/pdf" onChange={handleFileChange} />
            )}
          </div>

          {/* Right: Parsed fields */}
          <div className={styles.right}>
            <label>Billing Start</label>
            <input type="date" value={billingStart} onChange={(e) => setBillingStart(e.target.value)} />
            <label>Billing End</label>
            <input type="date" value={billingEnd} onChange={(e) => setBillingEnd(e.target.value)} />
            <label>Day Units (kWh)</label>
            <input value={dayKWh} onChange={(e) => setDayKWh(e.target.value)} />
            <label>Night Units (kWh)</label>
            <input value={nightKWh} onChange={(e) => setNightKWh(e.target.value)} />
            <label>MIC (kVa)</label>
            <input value={mic} onChange={(e) => setMIC(e.target.value)} />
            <label>Day Rate</label>
            <input value={dayRate} onChange={(e) => setDayRate(e.target.value)} />
            <label>Night Rate</label>
            <input value={nightRate} onChange={(e) => setNightRate(e.target.value)} />
            <label>Day Total (€)</label>
            <input value={dayTotal} onChange={(e) => setDayTotal(e.target.value)} />
            <label>Night Total (€)</label>
            <input value={nightTotal} onChange={(e) => setNightTotal(e.target.value)} />
            <label>Capacity Charge (€)</label>
            <input value={capacityCharge} onChange={(e) => setCapacityCharge(e.target.value)} />
            <label>PSO Levy (€)</label>
            <input value={psoLevy} onChange={(e) => setPSOLevy(e.target.value)} />
            <label>Electricity Tax (€)</label>
            <input value={electricityTax} onChange={(e) => setElectricityTax(e.target.value)} />
            <label>VAT (€)</label>
            <input value={vat} onChange={(e) => setVAT(e.target.value)} />
            <label>Total Amount (€)</label>
            <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
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
