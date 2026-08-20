import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Brush, Hand, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import './ImageEditor.css'; 

const ImageEditor = ({ originalImageSrc, processedImageSrc, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // The wrapper (handles scrolling)
  const contentRef = useRef(null); // The zoomable content
  const patternCanvasRef = useRef(document.createElement('canvas'));
  
  const [mode, setMode] = useState('erase'); // 'erase', 'restore', 'pan'
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  
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

  // Helper to get correct coordinates regardless of CSS scaling (object-fit: contain)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const contentRect = contentRef.current.getBoundingClientRect();
    
    // Support for both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calculate actual rendered dimensions inside the element due to object-fit: contain
    const elementAspectRatio = contentRect.width / contentRect.height;
    const canvasAspectRatio = canvas.width / canvas.height;
    
    let renderWidth = contentRect.width;
    let renderHeight = contentRect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasAspectRatio > elementAspectRatio) {
      // Image is wider, letterboxed top and bottom
      renderHeight = contentRect.width / canvasAspectRatio;
      offsetY = (contentRect.height - renderHeight) / 2;
    } else {
      // Image is taller, pillarboxed left and right
      renderWidth = contentRect.height * canvasAspectRatio;
      offsetX = (contentRect.width - renderWidth) / 2;
    }

    const scaleX = canvas.width / renderWidth;
    const scaleY = canvas.height / renderHeight;
    
    return {
      x: (clientX - contentRect.left - offsetX) * scaleX,
      y: (clientY - contentRect.top - offsetY) * scaleY,
      scaleX: scaleX
    };
  };

  const startInteraction = (e) => {
    if (mode === 'pan') {
      setIsPanning(true);
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      setLastPan({ x: clientX, y: clientY });
      return;
    }
    
    e.preventDefault(); // Prevent touch scrolling
    setIsDrawing(true);
    draw(e, true);
  };

  const stopInteraction = () => {
    if (mode === 'pan') {
      setIsPanning(false);
      return;
    }
    
    setIsDrawing(false);
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').beginPath();
    }
  };

  const handleMouseMove = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (mode === 'pan' && isPanning && containerRef.current) {
      const deltaX = clientX - lastPan.x;
      const deltaY = clientY - lastPan.y;
      containerRef.current.scrollBy(-deltaX, -deltaY);
      setLastPan({ x: clientX, y: clientY });
      return;
    }

    // Update custom cursor position relative to contentRef
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
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
    if (mode === 'pan') return;
    if (!isDrawing && !isFirstPoint) return;
    e.preventDefault(); 
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y, scaleX } = getCoordinates(e);

    // Apply the scale factor so the canvas paints EXACTLY the size of the screen cursor
    ctx.lineWidth = brushSize * scaleX;
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
            title="Erase Background"
          >
            <Eraser size={18} /> Erase
          </button>
          <button 
            className={`tool-btn ${mode === 'restore' ? 'active' : ''}`}
            onClick={() => setMode('restore')}
            title="Restore Original"
          >
            <Brush size={18} /> Restore
          </button>
          <button 
            className={`tool-btn ${mode === 'pan' ? 'active' : ''}`}
            onClick={() => setMode('pan')}
            title="Pan/Move (Mobile Friendly)"
          >
            <Hand size={18} /> Pan
          </button>
        </div>
        
        <div className="brush-slider-group">
          <button className="tool-btn" onClick={() => setZoom(z => Math.max(1, z - 0.5))} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span style={{ minWidth: '40px', textAlign: 'center' }}>{zoom * 100}%</span>
          <button className="tool-btn" onClick={() => setZoom(z => Math.min(5, z + 0.5))} title="Zoom In">
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="brush-slider-group">
          <span>Size: {brushSize}px</span>
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
      >
        <div 
          className="zoom-content"
          ref={contentRef}
          style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%`, position: 'relative' }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => { setIsHovering(false); stopInteraction(); }}
        >
          <div 
            className="brush-cursor" 
            style={{ 
              width: `${brushSize}px`, 
              height: `${brushSize}px`,
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              display: (isHovering && mode !== 'pan') ? 'block' : 'none'
            }}
          />
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            onMouseDown={startInteraction}
            onMouseMove={handleMouseMove}
            onMouseUp={stopInteraction}
            onTouchStart={startInteraction}
            onTouchMove={handleMouseMove}
            onTouchEnd={stopInteraction}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
