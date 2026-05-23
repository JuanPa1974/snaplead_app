import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import Dashboard from './components/Dashboard';
import CameraCapture from './components/CameraCapture';
import ManualCapture from './components/ManualCapture';
import QRScanner from './components/QRScanner';
import SettingsModal from './components/SettingsModal';
import Reports from './components/Reports';
import DataExtraction from './components/DataExtraction';
import LeadClassification from './components/LeadClassification';

// AndaraLab seal inline SVG
const AndaraLabSeal = () => (
  <svg width="110" height="22" viewBox="0 0 220 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <rect width="220" height="44" rx="22" fill="#0B1F45" stroke="#1C5ED6" strokeWidth="1.5"/>
    <g transform="translate(10,10)">
      <polygon points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9" fill="#1C5ED6" opacity="0.9"/>
    </g>
    <text x="36" y="16" fontFamily="Inter,system-ui,sans-serif" fontSize="9" fill="#6B9FE4" letterSpacing="1.5" fontWeight="500">POWERED BY</text>
    <text x="36" y="30" fontFamily="Outfit,system-ui,sans-serif" fontSize="13" fill="#FFFFFF" letterSpacing="0.5" fontWeight="700">AndaraLab</text>
  </svg>
);

function AppContent() {
  const [currentView, setCurrentView]     = useState('dashboard');
  const [showSettings, setShowSettings]   = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState({});

  // localStorage migration (runs once)
  useEffect(() => {
    const migrations = [
      ['goyaLeads',     'snapleadLeads'],
      ['scanleadEvent', 'snapleadEvent'],
      ['goyaLanguage',  'snapleadLanguage'],
    ];
    migrations.forEach(([oldKey, newKey]) => {
      const oldData = localStorage.getItem(oldKey);
      if (oldData && !localStorage.getItem(newKey)) localStorage.setItem(newKey, oldData);
      if (oldData) localStorage.removeItem(oldKey);
    });
  }, []);

  // ── NAV LABELS (bilingual quick access) ─────────────────────────────
  const label = {
    manual:    ['MANUAL',   'MANUAL'],
    camera:    ['CÁMARA',   'CAMERA'],
    qr:        ['LECTOR QR','QR'],
    dashboard: ['INICIO',   'HOME'],
    reports:   ['REPORTES', 'REPORTS'],
  };
  const L = (key) => {
    const lang = localStorage.getItem('snapleadLanguage') || 'es';
    return label[key][lang === 'es' ? 0 : 1];
  };

  // Shared nav button style factory
  const navBtn = (view, variant = 'default') => {
    const isActive = currentView === view ||
      (view === 'camera' && ['camera','extraction'].includes(currentView)) ||
      (view === 'manual' && currentView === 'manual') ||
      (view === 'qr' && currentView === 'qr');

    if (variant === 'capture-main') {
      // The primary CTA (Cámara)
      return {
        flex: 1, padding: '10px 6px',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.25)',
        background: isActive
          ? 'rgba(11,58,130,0.92)'
          : 'rgba(28,94,214,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#FFFFFF',
        fontWeight: 800, fontSize: '12px',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        boxShadow: '0 4px 16px rgba(28,94,214,0.32), inset 0 1px 0 rgba(255,255,255,0.15)',
        cursor: 'pointer', transition: 'all 0.2s'
      };
    }

    if (variant === 'capture-side') {
      return {
        flex: 1, padding: '10px 6px',
        borderRadius: '14px',
        border: `1px solid ${isActive ? 'rgba(28,94,214,0.30)' : '#E5E7EB'}`,
        background: isActive
          ? 'rgba(28,94,214,0.09)'
          : 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: isActive ? '#0B3A82' : '#6B7280',
        fontWeight: 700, fontSize: '12px',
        letterSpacing: '0.05em', textTransform: 'uppercase',
        cursor: 'pointer', transition: 'all 0.2s'
      };
    }

    // Bottom nav (default)
    return {
      flex: 1, padding: '10px 6px',
      borderRadius: '14px',
      border: `1px solid ${isActive ? 'rgba(28,94,214,0.25)' : '#E5E7EB'}`,
      background: isActive
        ? 'rgba(28,94,214,0.08)'
        : 'rgba(255,255,255,0.55)',
      color: isActive ? '#0B3A82' : '#6B7280',
      fontWeight: 700, fontSize: '12px',
      letterSpacing: '0.05em', textTransform: 'uppercase',
      cursor: 'pointer', transition: 'all 0.2s'
    };
  };

  return (
    <div style={{ background: '#F7F8FC', minHeight: '100vh', paddingBottom: '130px' }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 18px',
        borderBottom: '1px solid rgba(229,231,235,0.8)',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/snaplead-logo.svg" alt="SnapLead"
            style={{ width: 38, height: 38, borderRadius: '10px', flexShrink: 0, boxShadow: '0 2px 8px rgba(11,58,130,0.18)' }}
          />
          <div>
            <div style={{
              color: '#0B3A82', fontWeight: 800, fontSize: '19px',
              lineHeight: 1.1, letterSpacing: '-0.02em',
              fontFamily: 'Outfit, system-ui, sans-serif'
            }}>SnapLead</div>
            <div style={{
              color: '#9CA3AF', fontSize: '10px', marginTop: '1px',
              letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600
            }}>Smart lead capture</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AndaraLabSeal />
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid rgba(229,231,235,0.9)',
              background: 'rgba(248,249,251,0.7)', backdropFilter: 'blur(8px)',
              cursor: 'pointer', fontSize: '16px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >⚙️</button>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main style={{ padding: '18px 16px 0' }}>
        {currentView === 'dashboard'   && <Dashboard />}
        {currentView === 'manual'      && (
          <ManualCapture changeView={setCurrentView} setExtractedData={setExtractedData} />
        )}
        {currentView === 'camera'      && (
          <CameraCapture changeView={setCurrentView} setCapturedImage={setCapturedImage} />
        )}
        {currentView === 'qr'          && (
          <QRScanner changeView={setCurrentView} setExtractedData={setExtractedData} />
        )}
        {currentView === 'extraction'  && (
          <DataExtraction image={capturedImage} changeView={setCurrentView} setExtractedData={setExtractedData} />
        )}
        {currentView === 'classification' && (
          <LeadClassification data={extractedData} changeView={setCurrentView} />
        )}
        {currentView === 'reports'     && <Reports />}
      </main>

      {/* ── BOTTOM NAV (double row) ─────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(229,231,235,0.7)',
        padding: '10px 14px 20px',
        zIndex: 20,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)'
      }}>
        {/* Row 1: Capture modes */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button onClick={() => setCurrentView('manual')} style={navBtn('manual', 'capture-side')}>
            ✍️ {L('manual')}
          </button>
          <button onClick={() => setCurrentView('camera')} style={navBtn('camera', 'capture-main')}>
            📷 {L('camera')}
          </button>
          <button onClick={() => setCurrentView('qr')} style={navBtn('qr', 'capture-side')}>
            <span style={{ fontSize: '13px' }}>⬛</span> {L('qr')}
          </button>
        </div>

        {/* Row 2: Main views */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setCurrentView('dashboard')} style={navBtn('dashboard')}>
            🏠 {L('dashboard')}
          </button>
          <button onClick={() => setCurrentView('reports')} style={navBtn('reports')}>
            📊 {L('reports')}
          </button>
        </div>
      </nav>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
