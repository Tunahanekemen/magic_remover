import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2, Download, Trash2 } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import './ImageWorkspace.css';

const ImageWorkspace = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processImage = async (file) => {
    if (!file) return;
    
    // Create an object URL for the original image to display immediately
    const originalUrl = URL.createObjectURL(file);
    setOriginalImage(originalUrl);
    setProcessedImage(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Configuration for the background removal
      const config = {
        progress: (key, current, total) => {
          // Calculate overall progress (simplified for UX)
          const percentage = Math.round((current / total) * 100);
          setProgress(percentage > 100 ? 100 : percentage);
        }
      };

      // Process the image
      const blob = await removeBackground(file, config);
      
      // Create a URL for the processed blob
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImage(processedUrl);
      setProgress(100);
    } catch (error) {
      console.error("Error removing background:", error);
      alert("Failed to remove background. Please try a different image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processImage(file);
      } else {
        alert("Please upload an image file.");
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = 'removed-background.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (processedImage) URL.revokeObjectURL(processedImage);
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="workspace-container glass-panel">
      {!originalImage ? (
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-content">
            <div className="icon-circle">
              <Upload size={32} className="text-accent-primary" />
            </div>
            <h2>Upload an image</h2>
            <p>Drag and drop or click to browse</p>
            <span className="supported-formats">Supports JPG, PNG, WEBP</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden-input" 
          />
        </div>
      ) : (
        <div className="results-view">
          <div className="images-container">
            <div className="image-box">
              <span className="badge">Original</span>
              <img src={originalImage} alt="Original" />
            </div>
            
            <div className="image-box checkerboard">
              <span className="badge badge-accent">Result</span>
              {isProcessing ? (
                <div className="processing-overlay">
                  <Loader2 className="spinner" size={48} />
                  <p>Processing...</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="progress-text">{progress}% (Downloading AI Model if first time)</span>
                </div>
              ) : processedImage ? (
                <img src={processedImage} alt="Processed" className="processed-img" />
              ) : null}
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleReset} disabled={isProcessing}>
              <Trash2 size={18} />
              Start Over
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleDownload} 
              disabled={isProcessing || !processedImage}
            >
              <Download size={18} />
              Download Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageWorkspace;
