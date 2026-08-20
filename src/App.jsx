import React from 'react';
import './App.css';
import AdBanner from './components/AdBanner';
import ImageWorkspace from './components/ImageWorkspace';
import { Sparkles } from 'lucide-react';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1 className="gradient-text">
          Magic Background Eraser <Sparkles className="inline-block ml-2 text-accent-primary" size={36} />
        </h1>
        <p>100% Free • Works Offline • Instant Results</p>
      </header>
      
      <main className="main-layout">
        {/* Left Adsterra Banner */}
        <aside className="ad-column">
          <AdBanner position="left" />
          <div className="mobile-only-ad">
            <AdBanner position="left-2" />
          </div>
        </aside>

        {/* Center Workspace */}
        <section className="workspace-column">
          <ImageWorkspace />
        </section>

        {/* Right Adsterra Banner */}
        <aside className="ad-column">
          <AdBanner position="right" />
          <div className="mobile-only-ad">
            <AdBanner position="right-2" />
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
