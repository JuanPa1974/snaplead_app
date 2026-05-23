import React, { useState, useEffect } from 'react';
import { BarChart3, Camera, Home, PenLine, QrCode, Settings } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';
import Dashboard from './components/Dashboard';
import CameraCapture from './components/CameraCapture';
import ManualCapture from './components/ManualCapture';
import QRScanner from './components/QRScanner';
import SettingsModal from './components/SettingsModal';
import Reports from './components/Reports';
import DataExtraction from './components/DataExtraction';
import LeadClassification from './components/LeadClassification';
import andaraPoweredBy from './assets/brand/andaralab-poweredby-horizontal.png';

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
  const navTransition = 'transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, color 180ms ease, opacity 180ms ease';

  const navBtn = (view, variant = 'default') => {
    const isActive = currentView === view ||
      (view === 'camera' && ['camera','extraction'].includes(currentView)) ||
      (view === 'manual' && currentView === 'manual') ||
      (view === 'qr' && currentView === 'qr');

    if (variant === 'capture-main') {
      // The primary CTA (Cámara)
      return {
        flex: 1, padding: '11px 8px',
        borderRadius: '18px',
        border: '1px solid rgba(249,115,22,0.28)',
        background: isActive
          ? 'linear-gradient(135deg, #F97316, #D97706)'
          : 'rgba(249,115,22,0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        color: '#FFFFFF',
        fontWeight: 800, fontSize: '12px',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        boxShadow: '0 10px 32px rgba(249,115,22,0.18), inset 0 1px 0 rgba(255,255,255,0.16)',
        cursor: 'pointer', transition: navTransition, touchAction: 'manipulation'
      };
    }

    if (variant === 'capture-side') {
      return {
        flex: 1, padding: '11px 8px',
        borderRadius: '18px',
        border: `1px solid ${isActive ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.07)'}`,
        background: isActive
          ? 'rgba(249,115,22,0.10)'
          : 'rgba(42,54,71,0.58)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        color: isActive ? '#FFFFFF' : '#B6C0CF',
        fontWeight: 700, fontSize: '12px',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        cursor: 'pointer', transition: navTransition, touchAction: 'manipulation'
      };
    }

    // Bottom nav (default)
    return {
      flex: 1, padding: '11px 8px',
      borderRadius: '18px',
      border: `1px solid ${isActive ? 'rgba(249,115,22,0.20)' : 'rgba(255,255,255,0.06)'}`,
      background: isActive
        ? 'rgba(249,115,22,0.09)'
        : 'rgba(36,48,65,0.52)',
      color: isActive ? '#FFFFFF' : '#B6C0CF',
      fontWeight: 700, fontSize: '12px',
      letterSpacing: '0.04em', textTransform: 'uppercase',
      cursor: 'pointer', transition: navTransition, touchAction: 'manipulation'
    };
  };

  return (
    <div style={{
      background: 'radial-gradient(circle at top left, rgba(249,115,22,0.08), transparent 25%), linear-gradient(180deg, #1B2431 0%, #121A24 100%)',
      minHeight: '100dvh',
      paddingBottom: 'calc(158px + env(safe-area-inset-bottom))',
      color: '#FFFFFF'
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(18,26,36,0.72)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/snaplead-logo.svg" alt="SnapLead"
            style={{ width: 38, height: 38, borderRadius: '12px', flexShrink: 0, boxShadow: '0 12px 28px rgba(0,0,0,0.22)' }}
          />
          <div>
            <div style={{
              color: '#FFFFFF', fontWeight: 800, fontSize: '19px',
              lineHeight: 1.1, letterSpacing: '0',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>SnapLead</div>
            <div style={{
              color: '#B6C0CF', fontSize: '10px', marginTop: '2px',
              letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600
            }}>Smart lead capture</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <img
            src={andaraPoweredBy}
            alt="Powered by AndaraLab"
            className="andara-poweredby"
          />
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: 38, height: 38, borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(42,54,71,0.72)', backdropFilter: 'blur(14px)',
              color: '#FFFFFF',
              cursor: 'pointer', fontSize: '16px', flexShrink: 0,
              transition: 'transform 180ms ease, background 180ms ease, border-color 180ms ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          ><Settings size={18} /></button>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main style={{ padding: '20px 16px 0', maxWidth: '720px', margin: '0 auto' }}>
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
        position: 'fixed', bottom: 'calc(14px + env(safe-area-inset-bottom))', left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(94vw, 560px)',
        background: 'rgba(18,26,36,0.72)',
        backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '28px',
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
        zIndex: 20,
        boxShadow: '0 22px 70px rgba(0,0,0,0.42), 0 0 40px rgba(249,115,22,0.06)'
      }}>
        {/* Row 1: Capture modes */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button onClick={() => setCurrentView('manual')} style={navBtn('manual', 'capture-side')}>
            <PenLine size={15} style={{ verticalAlign: '-3px', marginRight: '5px' }} /> {L('manual')}
          </button>
          <button onClick={() => setCurrentView('camera')} style={navBtn('camera', 'capture-main')}>
            <Camera size={15} style={{ verticalAlign: '-3px', marginRight: '5px' }} /> {L('camera')}
          </button>
          <button onClick={() => setCurrentView('qr')} style={navBtn('qr', 'capture-side')}>
            <QrCode size={15} style={{ verticalAlign: '-3px', marginRight: '5px' }} /> {L('qr')}
          </button>
        </div>

        {/* Row 2: Main views */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setCurrentView('dashboard')} style={navBtn('dashboard')}>
            <Home size={15} style={{ verticalAlign: '-3px', marginRight: '5px' }} /> {L('dashboard')}
          </button>
          <button onClick={() => setCurrentView('reports')} style={navBtn('reports')}>
            <BarChart3 size={15} style={{ verticalAlign: '-3px', marginRight: '5px' }} /> {L('reports')}
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
