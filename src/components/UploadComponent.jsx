// src/components/UploadComponent.js
import React from 'react';
import { useDropzone } from 'react-dropzone';

const UploadComponent = ({ onImageUpload }) => {
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const photoUrl = URL.createObjectURL(file);  // Creates a local URL for the file
    onImageUpload(photoUrl);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
  });

  return (
    <div {...getRootProps()} style={{ border: '2px dashed #007bff', padding: '20px', cursor: 'pointer' }}>
      <input {...getInputProps()} />
      <p>Drag & drop a photo, or click to select one</p>
    </div>
  );
};

export default UploadComponent;
