'use client';

import React from 'react';
import styles from '@/styles/FilterPanel.module.css';

interface FilterPanelProps {
  filters: {
    category: string;
    frequency: string;
    mandatoryOnly: boolean;
    search: string;
    type: string;
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
    <div className={styles.filterWrapper}>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <label>Category</label>
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="radio"
                name="category"
                value=""
                checked={filters.category === ''}
                onChange={() => handleChange('category', '')}
              />
              All
            </label>
            {categories.map((cat) => (
              <label key={cat}>
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={filters.category === cat}
                  onChange={() => handleChange('category', cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterItem}>
          <label>Frequency</label>
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="radio"
                name="frequency"
                value=""
                checked={filters.frequency === ''}
                onChange={() => handleChange('frequency', '')}
              />
              All
            </label>
            {frequencies.map((freq) => (
              <label key={freq}>
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={filters.frequency === freq}
                  onChange={() => handleChange('frequency', freq)}
                />
                {freq}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterItem}>
          <label>
            <input
              type="checkbox"
              checked={filters.mandatoryOnly}
              onChange={(e) => handleChange('mandatoryOnly', e.target.checked)}
            />
            Mandatory Only
          </label>
        </div>

        <div className={styles.filterItem}>
          <label>Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search by task..."
          />
        </div>
      </div>
    </div>
  );
}
