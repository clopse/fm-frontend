// components/WaterChart.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Droplets, Loader2, MousePointer2 } from "lucide-react";
import React from "react";
import type { WaterMonthEntry } from "../hooks/useWaterMonthlyData";

interface WaterChartProps {
  data: WaterMonthEntry[];
  loading: boolean;
  onMonthClick?: (month: string) => void;
}

export default function WaterChart({ data, loading, onMonthClick }: WaterChartProps) {
  // Loading
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Water Usage</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading water data...</span>
          </div>
        </div>
      </div>
    );
  }

  // No Data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Water Usage</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No water data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Click handler for bars
  const handleBarClick = (data: any) => {
    if (onMonthClick && data && data.month) {
      onMonthClick(data.month); // Pass full string, e.g. "2025-06"
    }
  };

  // Tooltip formatter
  const formatTooltip = (value: any, name: string) => {
    if (name === "cubic_meters") return [`${value} m³`, "Water Usage"];
    if (name === "per_room_m3") return [`${value} m³`, "Per Room"];
    return [value, name];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="text-sm">
              {formatTooltip(entry.value, entry.dataKey)[1]}: {formatTooltip(entry.value, entry.dataKey)[0]}
            </p>
          ))}
          {onMonthClick && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MousePointer2 className="w-3 h-3" />
                <span>Click for bills</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Water Usage</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            style={{ cursor: onMonthClick ? "pointer" : "default" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={value => {
                try {
                  const date = new Date(value + "-01");
                  return date.toLocaleDateString("en-US", { month: "short" });
                } catch {
                  return value;
                }
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="cubic_meters"
              fill="#3B82F6"
              name="Water (m³)"
              onClick={handleBarClick}
              style={{ cursor: onMonthClick ? "pointer" : "default" }}
            />
            <Bar
              dataKey="per_room_m3"
              fill="#93C5FD"
              name="Per Room (m³)"
              onClick={handleBarClick}
              style={{ cursor: onMonthClick ? "pointer" : "default" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
