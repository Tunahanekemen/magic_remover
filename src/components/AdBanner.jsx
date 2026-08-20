import React, { useEffect, useRef, useState } from 'react';

const AdBanner = ({ position }) => {
  const bannerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 160, height: 600 });

  useEffect(() => {
    // Prevent multiple injections if the component re-renders
    if (bannerRef.current && bannerRef.current.children.length === 0) {
      const isMobile = window.innerWidth <= 1024;
      
      // Select ad configuration based on screen size
      const key = isMobile ? 'e7a9b7788bc25c5bd1f13a17ffa124f0' : '87e4c9a31120b561a87d4597181d65c1';
      const height = isMobile ? 50 : 600;
      const width = isMobile ? 320 : 160;
      
      setDimensions({ width, height });

      const confScript = document.createElement('script');
      confScript.type = 'text/javascript';
      confScript.innerHTML = `
        atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `https://www.highperformanceformat.com/${key}/invoke.js`;

      bannerRef.current.appendChild(confScript);
      bannerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div 
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: dimensions.height === 600 ? 'sticky' : 'static',
        top: dimensions.height === 600 ? '2rem' : 'auto',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        margin: '0 auto'
      }}
      ref={bannerRef}
    >
    </div>
  );
};

export default AdBanner;
