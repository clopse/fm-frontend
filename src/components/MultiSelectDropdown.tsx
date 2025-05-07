'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/MultiSelectDropdown.module.css';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={styles.dropdownWrapper} ref={ref}>
      <button className={styles.dropdownButton} onClick={() => setOpen(!open)}>
        {label}: {selected.length === 0 ? 'All' : `${selected.length} selected`}
      </button>
      {open && (
        <div className={styles.dropdownMenu}>
          {options.map((option) => (
            <label key={option} className={styles.dropdownItem}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
