'use client';

import { useRef, useState } from 'react';
import styles from '@/styles/TenderUploadModal.module.css';

interface TenderUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
}

const categories = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Kitchen',
  'Window Repair',
  'Door Repair',
  'Roof Repair',
  'General Maintenance',
];

export default function TenderUploadModal({
  visible,
  onClose,
  onSubmit,
}: TenderUploadModalProps) {
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    dueDate: '',
    file: null as File | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
  };

  const handleSubmit = () => {
    if (!form.category || !form.title || !form.dueDate) {
      alert('Please complete all required fields.');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Tender</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.form}>
          <label>
            Category *
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label>
            Job Title *
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Replace lobby panel"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </label>

          <label>
            Location / Area
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Lobby, 3rd Floor"
            />
          </label>

          <label>
            Due Date *
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
          </label>

          <label>
            Optional File Upload
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>

          <button className={styles.submitBtn} onClick={handleSubmit}>
            Create Tender
          </button>
        </div>
      </div>
    </div>
  );
}
