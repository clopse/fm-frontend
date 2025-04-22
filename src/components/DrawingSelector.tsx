'use client';

import styles from '@/styles/DrawingSelector.module.css';

type Props = {
  levels: string[];
  types: string[];
  selectedLevel: string;
  selectedType: string;
  onLevelChange: (value: string) => void;
  onTypeChange: (value: string) => void;
};

export default function DrawingSelector({
  levels,
  types,
  selectedLevel,
  selectedType,
  onLevelChange,
  onTypeChange,
}: Props) {
  return (
    <div className={styles.selector}>
      <label>
        Level:
        <select value={selectedLevel} onChange={(e) => onLevelChange(e.target.value)}>
          <option value="">All</option>
          {levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label>
        Type:
        <select value={selectedType} onChange={(e) => onTypeChange(e.target.value)}>
          <option value="">All</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
