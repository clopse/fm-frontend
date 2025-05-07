'use client';

import React, { useState } from 'react';
import styles from '@/styles/FilterPanel.module.css';

interface FilterPanelProps {
  filters: {
    category: string;
    frequency: string;
    mandatoryOnly: boolean;
    search: string;
    type: string;
  };
  onChange: (filters: FilterPanelProps['filters']) => void;
  categories: string[];
  frequencies: string[];
}

export default function FilterPanel({ filters, onChange, categories, frequencies }: FilterPanelProps) {
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showFreqDropdown, setShowFreqDropdown] = useState(false);

  const toggleCategory = (value: string) => {
    onChange({ ...filters, category: value });
    setShowCatDropdown(false);
  };

  const toggleFrequency = (value: string) => {
    onChange({ ...filters, frequency: value });
    setShowFreqDropdown(false);
  };

  return (
    <div className={styles.filterWrapper}>
      <div className={styles.filterRow}>
        {/* Category dropdown */}
        <div className={styles.filterItem}>
          <label>Category</label>
          <div onClick={() => setShowCatDropdown((v) => !v)} className={styles.dropdownHeader}>
            {filters.category || 'All Categories'}
          </div>
          {showCatDropdown && (
            <div className={styles.dropdownList}>
              <label onClick={() => toggleCategory('')}>All</label>
              {categories.map((cat) => (
                <label key={cat} onClick={() => toggleCategory(cat)}>{cat}</label>
              ))}
            </div>
          )}
        </div>

        {/* Frequency dropdown */}
        <div className={styles.filterItem}>
          <label>Frequency</label>
          <div onClick={() => setShowFreqDropdown((v) => !v)} className={styles.dropdownHeader}>
            {filters.frequency || 'All Frequencies'}
          </div>
          {showFreqDropdown && (
            <div className={styles.dropdownList}>
              <label onClick={() => toggleFrequency('')}>All</label>
              {frequencies.map((freq) => (
                <label key={freq} onClick={() => toggleFrequency(freq)}>{freq}</label>
              ))}
            </div>
          )}
        </div>

        {/* Mandatory toggle */}
        <div className={styles.filterItem}>
          <label>
            <input
              type="checkbox"
              checked={filters.mandatoryOnly}
              onChange={(e) => onChange({ ...filters, mandatoryOnly: e.target.checked })}
            />
            &nbsp;Mandatory Only
          </label>
        </div>

        {/* Search input */}
        <div className={styles.filterItem}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by task..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
