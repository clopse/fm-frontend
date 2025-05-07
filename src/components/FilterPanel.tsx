'use client';

import React from 'react';
import styles from '@/styles/FilterPanel.module.css';

interface FilterPanelProps {
  filters: {
    category: string;
    frequency: string;
    mandatoryOnly: boolean;
    search: string;
    type: string; // ← this was missing in your version
  };
  onChange: (filters: {
    category: string;
    frequency: string;
    mandatoryOnly: boolean;
    search: string;
    type: string;
  }) => void;
  categories: string[];
  frequencies: string[];
}


export default function FilterPanel({ filters, onChange, categories, frequencies }: FilterPanelProps) {
  const handleChange = (key: keyof FilterPanelProps['filters'], value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className={styles.panel}>
      <select
        className={styles.select}
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        className={styles.select}
        value={filters.frequency}
        onChange={(e) => handleChange('frequency', e.target.value)}
      >
        <option value="">All Frequencies</option>
        {frequencies.map((freq) => (
          <option key={freq} value={freq}>{freq}</option>
        ))}
      </select>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={filters.mandatoryOnly}
          onChange={(e) => handleChange('mandatoryOnly', e.target.checked)}
        />
        Mandatory Only
      </label>

      <input
        type="text"
        className={styles.search}
        placeholder="Search by task..."
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
      />
    </div>
  );
}
