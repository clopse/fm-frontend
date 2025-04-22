"use client";

import React, { useState } from "react";
import styles from "@/styles/SafetyScore.module.css";

type UploadBoxProps = {
  taskId: string;
  onUpload?: (taskId: string, fileInfo: any) => void;
};

export default function UploadBox({ taskId, onUpload }: UploadBoxProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (onUpload) {
        const fileInfo = {
          name: selectedFile.name,
          uploadedAt: new Date(),
        };
        onUpload(taskId, fileInfo);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {file && <div className={styles.uploadInfo}>Uploaded: {file.name}</div>}
    </div>
  );
}
