'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import styles from "./utilities.module.css";
import { hotelNames } from "@/data/hotelMetadata";
import AddUtilityModal from "@/components/AddUtilityModal";

interface ElectricityEntry {
  month: string;
  day_kwh: number;
  night_kwh: number;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
}

interface GasEntry {
  period: string;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
}

interface WaterEntry {
  month: string;
  cubic_meters: number;
  total_eur: number;
  per_room_m3: number;
}

interface HotelTotals {
  hotelId: string;
  electricity: number;
  gas: number;
}

const hotelOptions = ["hiex", "moxy", "hida", "hbhdcc", "hbhe", "sera", "marina"];

const sampleElectricity2025: ElectricityEntry[] = [
  { month: "Jan", day_kwh: 48000, night_kwh: 29500, total_kwh: 77500, total_eur: 20500, per_room_kwh: 392 },
  { month: "Feb", day_kwh: 41000, night_kwh: 26000, total_kwh: 67000, total_eur: 16500, per_room_kwh: 339 },
  { month: "Mar", day_kwh: 50000, night_kwh: 30500, total_kwh: 80500, total_eur: 19000, per_room_kwh: 410 },
];

const sampleGas2025: GasEntry[] = [
  { period: "Jan", total_kwh: 42000, total_eur: 4600, per_room_kwh: 212 },
  { period: "Feb", total_kwh: 40000, total_eur: 4300, per_room_kwh: 202 },
  { period: "Mar", total_kwh: 45000, total_eur: 4700, per_room_kwh: 225 },
];

const sampleWater2025: WaterEntry[] = [
  { month: "Jan", cubic_meters: 320, total_eur: 900, per_room_m3: 1.6 },
  { month: "Feb", cubic_meters: 290, total_eur: 820, per_room_m3: 1.45 },
  { month: "Mar", cubic_meters: 350, total_eur: 980, per_room_m3: 1.77 },
];

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  const [year, setYear] = useState("2025");
  const [viewMode, setViewMode] = useState("kwh");
  const [electricity, setElectricity] = useState<ElectricityEntry[]>([]);
  const [gas, setGas] = useState<GasEntry[]>([]);
  const [water, setWater] = useState<WaterEntry[]>([]);
  const [multiHotelData, setMultiHotelData] = useState<HotelTotals[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    if (!hotelId) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/${hotelId}/${year}`);
    const data = await res.json();

    if (year === "2025" && (!data?.electricity?.length || !data?.gas?.length)) {
      setElectricity(sampleElectricity2025);
      setGas(sampleGas2025);
      setWater(sampleWater2025);
    } else {
      setElectricity(data.electricity || []);
      setGas(data.gas || []);
      setWater([]);
    }
  };

  useEffect(() => { fetchData(); }, [hotelId, year]);

  useEffect(() => {
    async function fetchAllHotelData() {
      const results = await Promise.all(hotelOptions.map(async (id) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/${id}/${year}`);
        const data = await res.json();
        const electricity = data.electricity?.reduce((sum: number, e: ElectricityEntry) =>
          sum + (viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh), 0) || 0;
        const gas = data.gas?.reduce((sum: number, g: GasEntry) =>
          sum + (viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh), 0) || 0;
        return { hotelId: id, electricity: Math.round(electricity), gas: Math.round(gas) };
      }));
      setMultiHotelData(results);
    }

    fetchAllHotelData();
  }, [year, viewMode]);

  const formatElectricity = () =>
    electricity.map((e) => ({
      ...e,
      value: viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh,
    }));

  const formatGas = () =>
    gas.map((g) => ({
      ...g,
      value: viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh,
    }));

  const totalElectricity = electricity.reduce((sum, e) =>
    sum + (viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh), 0);

  const totalGas = gas.reduce((sum, g) =>
    sum + (viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh), 0);

  if (!hotelId) return <p>Loading hotel data...</p>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <h2>{hotelNames[hotelId] || hotelId.toUpperCase()} Utilities Dashboard</h2>
        <div>
          <label>Year:</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label>View:</label>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="kwh">kWh</option>
            <option value="eur">€ Cost</option>
            <option value="room">kWh/room</option>
          </select>
        </div>
        <div>
          <button onClick={() => window.print()}>Export PDF</button>
          <button onClick={() => setShowModal(true)}>+ Add Utility Bill</button>
        </div>
      </div>

      {showModal && (
        <AddUtilityModal
          hotelId={hotelId}
          onClose={() => setShowModal(false)}
          onSave={fetchData}
        />
      )}

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <h4>Total Electricity ({viewMode})</h4>
          <p>{Math.round(totalElectricity).toLocaleString()}</p>
        </div>
        <div className={styles.kpiCard}>
          <h4>Total Gas ({viewMode})</h4>
          <p>{Math.round(totalGas).toLocaleString()}</p>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Electricity by Month ({viewMode})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatElectricity()}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Gas by Period ({viewMode})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatGas()}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Electricity Trend Line</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formatElectricity()}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#7c3aed" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Gas Trend Line</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formatGas()}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#059669" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {water.length > 0 && (
        <div className={styles.chartWrapper}>
          <h3>Water Usage by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={water}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cubic_meters" fill="#60a5fa" name="Water (m³)" />
              <Bar dataKey="total_eur" fill="#d97706" name="Cost (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.chartWrapper}>
        <h3>Multi-Hotel Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={multiHotelData}>
            <XAxis dataKey="hotelId" tickFormatter={(id) => hotelNames[id] || id} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="electricity" fill="#3b82f6" name="Electricity" />
            <Bar dataKey="gas" fill="#10b981" name="Gas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
