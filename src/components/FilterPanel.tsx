'use client';

import React, { useState } from 'react';
import styles from '@/styles/FilterPanel.module.css';
import { ChevronDown } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    category: string[];
    frequency: string[];
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

  const toggleMultiValue = (key: 'category' | 'frequency', value: string) => {
    const current = filters[key];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: newValues });
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
            {filters.category.length ? filters.category.join(', ') : 'Select Categories'}{' '}
            <ChevronDown size={16} />
          </div>
          {categoryOpen && (
            <div className={styles.dropdownMenu}>
              {categories.map((cat) => (
                <label key={cat} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={filters.category.includes(cat)}
                    onChange={() => toggleMultiValue('category', cat)}
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
            {filters.frequency.length ? filters.frequency.join(', ') : 'Select Frequencies'}{' '}
            <ChevronDown size={16} />
          </div>
          {frequencyOpen && (
            <div className={styles.dropdownMenu}>
              {frequencies.map((freq) => (
                <label key={freq} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    checked={filters.frequency.includes(freq)}
                    onChange={() => toggleMultiValue('frequency', freq)}
                  />
                  {freq}
                </label>
              ))}
            </div>
          )}
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
