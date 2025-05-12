'use client';

import React, { useEffect, useRef, useState } from 'react';
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

  const categoryRef = useRef<HTMLDivElement>(null);
  const frequencyRef = useRef<HTMLDivElement>(null);

  const toggleMultiValue = (key: 'category' | 'frequency', value: string) => {
    const current = filters[key];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: newValues });
  };

  const toggleAll = (key: 'category' | 'frequency', values: string[]) => {
    const allSelected = filters[key].length === values.length;
    onChange({ ...filters, [key]: allSelected ? [] : values });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
      if (frequencyRef.current && !frequencyRef.current.contains(event.target as Node)) {
        setFrequencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.filterWrapper}>
      <div className={styles.filterRow}>
        {/* Category Dropdown */}
        <div ref={categoryRef} className={styles.dropdownWrapper}>
          <div className={styles.dropdownButton} onClick={() => setCategoryOpen((prev) => !prev)}>
            {filters.category.length ? filters.category.join(', ') : 'Select Categories'} <ChevronDown size={16} />
          </div>
          {categoryOpen && (
            <div className={styles.dropdownMenu}>
              <div
                className={styles.optionItem}
                onClick={() => toggleAll('category', categories)}
              >
                <input
                  type="checkbox"
                  checked={filters.category.length === categories.length}
                  readOnly
                />
                Select All
              </div>
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
        <div ref={frequencyRef} className={styles.dropdownWrapper}>
          <div className={styles.dropdownButton} onClick={() => setFrequencyOpen((prev) => !prev)}>
            {filters.frequency.length ? filters.frequency.join(', ') : 'Select Frequencies'} <ChevronDown size={16} />
          </div>
          {frequencyOpen && (
            <div className={styles.dropdownMenu}>
              <div
                className={styles.optionItem}
                onClick={() => toggleAll('frequency', frequencies)}
              >
                <input
                  type="checkbox"
                  checked={filters.frequency.length === frequencies.length}
                  readOnly
                />
                Select All
              </div>
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

        {/* Search bubble */}
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
