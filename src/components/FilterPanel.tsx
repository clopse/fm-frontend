'use client';

import React, { useState } from 'react';
import styles from '@/styles/FilterPanel.module.css';
import { ChevronDown } from 'lucide-react';

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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);

  const toggleValue = (key: 'category' | 'frequency', value: string) => {
    const current = filters[key];
    const newValue = current === value ? '' : value;
    onChange({ ...filters, [key]: newValue });
  };

  return (
    <div className={styles.filterWrapper}>
      <div className={styles.filterRow}>
        {/* Category Dropdown */}
        <div className={styles.dropdownWrapper}>
          <div
            className={styles.dropdownButton}
            onClick={() => setCategoryOpen((prev) => !prev)}
          >
            {filters.category || 'Select Category'} <ChevronDown size={16} />
          </div>
          {categoryOpen && (
            <div className={styles.dropdownMenu}>
              {categories.map((cat) => (
                <label key={cat} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={filters.category === cat}
                    onChange={() => toggleValue('category', cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Frequency Dropdown */}
        <div className={styles.dropdownWrapper}>
          <div
            className={styles.dropdownButton}
            onClick={() => setFrequencyOpen((prev) => !prev)}
          >
            {filters.frequency || 'Select Frequency'} <ChevronDown size={16} />
          </div>
          {frequencyOpen && (
            <div className={styles.dropdownMenu}>
              {frequencies.map((freq) => (
                <label key={freq} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={filters.frequency === freq}
                    onChange={() => toggleValue('frequency', freq)}
                  />
                  {freq}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Mandatory only checkbox */}
        <div className={styles.filterItem}>
          <label>
            <input
              type="checkbox"
              checked={filters.mandatoryOnly}
              onChange={(e) => onChange({ ...filters, mandatoryOnly: e.target.checked })}
            />{' '}
            Mandatory Only
          </label>
        </div>

        {/* Search field */}
        <div className={styles.filterItem}>
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
