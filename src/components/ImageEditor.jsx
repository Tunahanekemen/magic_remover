import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Brush, Check, X } from 'lucide-react';
import './ImageEditor.css'; 

const ImageEditor = ({ originalImageSrc, processedImageSrc, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const patternCanvasRef = useRef(document.createElement('canvas')); // Offscreen canvas for the pattern
  
  const [mode, setMode] = useState('erase'); // 'erase' or 'restore'
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !originalImageSrc || !processedImageSrc) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pCanvas = patternCanvasRef.current;
    const pCtx = pCanvas.getContext('2d');
    
    const origImg = new Image();
    const procImg = new Image();
    
    origImg.onload = () => {
      // Set canvas dimensions to match the image precisely
      canvas.width = origImg.width;
      canvas.height = origImg.height;
      pCanvas.width = origImg.width;
      pCanvas.height = origImg.height;
      
      // Draw original image to offscreen canvas to use as a pattern
      pCtx.drawImage(origImg, 0, 0);
      
      // Load processed image on top
      procImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(procImg, 0, 0, canvas.width, canvas.height);
      };
      procImg.src = processedImageSrc;
    };
    origImg.src = originalImageSrc;
  }, [originalImageSrc, processedImageSrc]);

  // Helper to get correct coordinates regardless of CSS scaling
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Support for both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Scale coordinates based on actual canvas size vs displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent touch scrolling
    setIsDrawing(true);
    draw(e, true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').beginPath();
    }
  };

  const handleMouseMove = (e) => {
    // Update custom cursor position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX !== undefined && clientY !== undefined) {
        setCursorPos({
          x: clientX - rect.left,
          y: clientY - rect.top
        });
      }
    }
    draw(e);
  };

  const draw = (e, isFirstPoint = false) => {
    if (!isDrawing && !isFirstPoint) return;
    e.preventDefault(); // Prevent touch scrolling
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      const pattern = ctx.createPattern(patternCanvasRef.current, 'no-repeat');
      ctx.strokeStyle = pattern;
    }

    if (isFirstPoint) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button 
            className={`tool-btn ${mode === 'erase' ? 'active' : ''}`}
            onClick={() => setMode('erase')}
          >
            <Eraser size={18} /> Erase
          </button>
          <button 
            className={`tool-btn ${mode === 'restore' ? 'active' : ''}`}
            onClick={() => setMode('restore')}
          >
            <Brush size={18} /> Restore
          </button>
        </div>
        
        <div className="brush-slider-group">
          <span>Brush Size: {brushSize}px</span>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="brush-slider"
          />
        </div>

        <div className="toolbar-group">
          <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '0.5rem 1rem' }}>
            <X size={18} /> Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.5rem 1rem' }}>
            <Check size={18} /> Save
          </button>
        </div>
      </div>

      <div 
        className="canvas-wrapper" 
        ref={containerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); stopDrawing(); }}
      >
        <div 
          className="brush-cursor" 
          style={{ 
            width: `${brushSize}px`, 
            height: `${brushSize}px`,
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            display: isHovering ? 'block' : 'none'
          }}
        />
        <canvas
          ref={canvasRef}
          className="editor-canvas"
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={handleMouseMove}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
};

export default ImageEditor;
