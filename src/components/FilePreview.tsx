import { useState, useEffect } from 'react';

const FilePreview = ({ file }: { file: File }) => {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (file.type === 'application/pdf') {
      // Use react-pdf to render PDF preview
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else if (file.type.startsWith('image/')) {
      // Render image preview
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // Handle Excel preview
      handleExcelPreview(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle Word preview
      handleWordPreview(file);
    }
  }, [file]);

  function handleExcelPreview(file: File) {
    // Excel preview logic here
  }

  function handleWordPreview(file: File) {
    // Word preview logic here (using Mammoth.js or similar)
  }

  return (
    <div>
      {filePreview && (
        <div>
          {file.type === 'application/pdf' && <iframe src={filePreview} width="100%" height="400px" />}
          {file.type.startsWith('image/') && <img src={filePreview} alt="Preview" />}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
