'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
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

interface HotelTotals {
  hotelId: string;
  electricity: number;
  gas: number;
}

const hotelOptions = ["hiex", "moxy", "hida", "hbhdcc", "hbhe", "sera", "marina"];

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  const [year, setYear] = useState("2025");
  const [viewMode, setViewMode] = useState("kwh");
  const [electricity, setElectricity] = useState<ElectricityEntry[]>([]);
  const [gas, setGas] = useState<GasEntry[]>([]);
  const [multiHotelData, setMultiHotelData] = useState<HotelTotals[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!hotelId) return;

    async function fetchData() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/${hotelId}/${year}`);
      const data = await res.json();

      setElectricity(data.electricity || []);
      setGas(data.gas || []);
    }

    fetchData();
  }, [hotelId, year]);

  useEffect(() => {
    async function fetchAllHotelData() {
      const promises = hotelOptions.map(async (id) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/${id}/${year}`);
        const data = await res.json();
        const eTotal = data.electricity?.reduce((sum: number, e: ElectricityEntry) => {
          return sum + (viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh);
        }, 0);
        const gTotal = data.gas?.reduce((sum: number, g: GasEntry) => {
          return sum + (viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh);
        }, 0);
        return { hotelId: id, electricity: Math.round(eTotal), gas: Math.round(gTotal) };
      });
      const results = await Promise.all(promises);
      setMultiHotelData(results);
    }

    fetchAllHotelData();
  }, [year, viewMode]);

  const getElectricityData = () => {
    return electricity.map((e) => ({
      ...e,
      value:
        viewMode === "eur"
          ? e.total_eur
          : viewMode === "room"
          ? e.per_room_kwh
          : e.total_kwh,
    }));
  };

  const getGasData = () => {
    return gas.map((g) => ({
      ...g,
      value:
        viewMode === "eur"
          ? g.total_eur
          : viewMode === "room"
          ? g.per_room_kwh
          : g.total_kwh,
    }));
  };

  const totalElectricity = electricity.reduce(
    (sum, e) =>
      sum +
      (viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh),
    0
  );

  const totalGas = gas.reduce(
    (sum, g) =>
      sum +
      (viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh),
    0
  );

  if (!hotelId) {
    return <p>Loading hotel data...</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <h2>{hotelNames[hotelId] || hotelId.toUpperCase()} Utilities Dashboard</h2>
        <div>
          <label htmlFor="year">Year:</label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label htmlFor="view">View by:</label>
          <select
            id="view"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
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
          onSave={() => {
            setShowModal(false);
            // Optional: Trigger refetch of data
          }}
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
          <BarChart data={getElectricityData()}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" name={viewMode} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Gas by Period ({viewMode})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getGasData()}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" name={viewMode} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Electricity Trend Line ({viewMode})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getElectricityData()}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#7c3aed" name={viewMode} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Gas Trend Line ({viewMode})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getGasData()}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#059669" name={viewMode} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartWrapper}>
        <h3>Multi-Hotel Comparison ({viewMode})</h3>
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
