"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Asset = {
  id: number;
  asset_code: string;
  hotel_id: string;
  location: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  quantity: number;
  manufacturer: string | null;
  model: string | null;
  status: string | null;
  condition: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AssetsPage() {
  const params = useParams<{ hotelId: string }>();
  const hotelId = params?.hotelId as string;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAssets() {
    if (!hotelId || !API_BASE) {
      setError("Missing hotel id or API base URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/assets?hotel_id=${encodeURIComponent(hotelId)}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to load assets", res.status, text);
        setError("Failed to load assets");
        setAssets([]);
        return;
      }

      const data: Asset[] = await res.json();
      setAssets(data || []);
    } catch (e) {
      console.error("Error loading assets", e);
      setError("Error loading assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const total = assets.length;

  return (
    <div className="p-6 space-y-4">
      <header className="border-b pb-3 mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl">Asset register</h1>
          <p className="text-sm text-gray-600">Hotel: {hotelId}</p>
        </div>

        <a
          href={`/hotels/${hotelId}/assets/wizard`}
          className="text-sm border px-3 py-2 rounded bg-gray-900 text-white"
        >
          Add asset
        </a>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm">Loading assets…</p>
      ) : total === 0 ? (
        <div className="border rounded p-4 space-y-3">
          <h2 className="text-lg">No assets yet</h2>
          <p className="text-sm text-gray-600">
            There are no assets stored yet for this hotel. Use the Add asset button above to
            create the first items with the wizard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{total} assets in this hotel.</p>
          <AssetsTable assets={assets} />
        </div>
      )}
    </div>
  );
}

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
            <th className="border px-2 py-1 text-left">Code</th>
            <th className="border px-2 py-1 text-left">Location</th>
            <th className="border px-2 py-1 text-left">Category</th>
            <th className="border px-2 py-1 text-left">Description</th>
            <th className="border px-2 py-1 text-right">Qty</th>
            <th className="border px-2 py-1 text-left">Manufacturer</th>
            <th className="border px-2 py-1 text-left">Model</th>
            <th className="border px-2 py-1 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => (
            <tr key={asset.id}>
              <td className="border px-2 py-1">{asset.asset_code}</td>
              <td className="border px-2 py-1">{asset.location ?? "-"}</td>
              <td className="border px-2 py-1">
                {asset.category}
                {asset.subcategory ? ` / ${asset.subcategory}` : ""}
              </td>
              <td className="border px-2 py-1">
                {asset.description ? asset.description.slice(0, 50) : "-"}
              </td>
              <td className="border px-2 py-1 text-right">{asset.quantity}</td>
              <td className="border px-2 py-1">{asset.manufacturer ?? "-"}</td>
              <td className="border px-2 py-1">{asset.model ?? "-"}</td>
              <td className="border px-2 py-1">{asset.status ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
