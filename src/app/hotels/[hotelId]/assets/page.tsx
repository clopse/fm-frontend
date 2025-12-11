"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Asset = {
  id: number;
  hotel_id: string;
  building?: string | null;
  floor?: number | null;
  room_number?: string | null;
  asset_group?: string | null;
  asset_category?: string | null;
  asset_name?: string | null;
  asset_description?: string | null;
  install_year?: number | null;
  expected_life_years?: number | null;
  remaining_life_years?: number | null;
  replacement_cost?: number | null;
  total_replacement_cost?: number | null;
  sale_factor?: number | null;
  total_sale_value?: number | null;
  condition?: string | null;
  status?: string | null;
};

type AssetListResponse = {
  total: number;
  items: Asset[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AssetsPage() {
  const params = useParams<{ hotelId: string }>();
  const hotelId = params?.hotelId as string;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAssets() {
    if (!hotelId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/hotels/${encodeURIComponent(hotelId)}/assets?limit=100&offset=0`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        setError("Failed to load assets");
        setAssets([]);
        setTotal(0);
        return;
      }

      const data: AssetListResponse = await res.json();
      setAssets(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError("Error loading assets");
      setAssets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  return (
    <div className="p-6 space-y-4">
      <header className="border-b pb-3 mb-2">
        <h1 className="text-xl">Asset register</h1>
        <p className="text-sm text-gray-600">
          Hotel: {hotelId}
        </p>
      </header>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm">Loading assets…</p>
      ) : total === 0 ? (
        <AssetWizardPlaceholder
          hotelId={hotelId}
          onAssetsGenerated={loadAssets}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {total} assets in this hotel.
            </p>
            {/* Later you can show a button to reopen the wizard if needed */}
            {/* <button className="text-xs border px-3 py-1 rounded">
              Open setup wizard
            </button> */}
          </div>
          <AssetsTable assets={assets} />
        </div>
      )}
    </div>
  );
}

// Simple placeholder for the wizard area.
// You will later replace this with the real AssetWizard component.
function AssetWizardPlaceholder(props: { hotelId: string; onAssetsGenerated: () => void }) {
  const { hotelId, onAssetsGenerated } = props;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/hotels/${encodeURIComponent(hotelId)}/asset-wizard/generate-assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      if (!res.ok) {
        setError("Failed to generate assets from wizard config");
        return;
      }

      await onAssetsGenerated();
    } catch (e) {
      setError("Error generating assets");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <h2 className="text-lg">Set up this hotel’s asset register</h2>
      <p className="text-sm text-gray-600">
        No assets are stored yet for this hotel. Use the asset setup wizard to generate a first
        pass based on floors, room types, plant and recent capex. Once generated you can refine
        items individually.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        {/* This would normally open the full wizard UI.
           For now we just call the generate endpoint directly. */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={saving}
          className="text-sm border px-3 py-2 rounded"
        >
          {saving ? "Generating…" : "Generate assets from wizard"}
        </button>
      </div>
    </div>
  );
}

// Simple starter table that only shows real data from backend.
// No fake rows are created.
function AssetsTable(props: { assets: Asset[] }) {
  const { assets } = props;

  if (!assets.length) {
    return <p className="text-sm text-gray-600">No assets found.</p>;
  }

  return (
    <div className="border rounded">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-2 py-1 text-left">Room / area</th>
            <th className="border px-2 py-1 text-left">Floor</th>
            <th className="border px-2 py-1 text-left">Group</th>
            <th className="border px-2 py-1 text-left">Category</th>
            <th className="border px-2 py-1 text-left">Asset</th>
            <th className="border px-2 py-1 text-left">Install year</th>
            <th className="border px-2 py-1 text-right">Replacement cost</th>
            <th className="border px-2 py-1 text-right">Total repl cost</th>
            <th className="border px-2 py-1 text-right">Sale value</th>
            <th className="border px-2 py-1 text-left">Condition</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="border px-2 py-1">
                {asset.room_number || asset.building || "-"}
              </td>
              <td className="border px-2 py-1">
                {asset.floor ?? ""}
              </td>
              <td className="border px-2 py-1">
                {asset.asset_group || ""}
              </td>
              <td className="border px-2 py-1">
                {asset.asset_category || ""}
              </td>
              <td className="border px-2 py-1">
                {asset.asset_name || ""}
              </td>
              <td className="border px-2 py-1">
                {asset.install_year ?? ""}
              </td>
              <td className="border px-2 py-1 text-right">
                {asset.replacement_cost != null ? asset.replacement_cost.toFixed(0) : ""}
              </td>
              <td className="border px-2 py-1 text-right">
                {asset.total_replacement_cost != null
                  ? asset.total_replacement_cost.toFixed(0)
                  : ""}
              </td>
              <td className="border px-2 py-1 text-right">
                {asset.total_sale_value != null ? asset.total_sale_value.toFixed(0) : ""}
              </td>
              <td className="border px-2 py-1">
                {asset.condition || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
