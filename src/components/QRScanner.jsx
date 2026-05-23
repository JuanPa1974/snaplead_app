import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { QrCode, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

// Parse vCard string into contact fields
const parseVCard = (text) => {
  const get = (key) => {
    const match = text.match(new RegExp(`${key}[^:]*:([^\r\n]+)`, 'i'));
    return match ? match[1].trim() : '';
  };

  const fullName =
    get('FN') ||
    (get('N') ? get('N').split(';').filter(Boolean).reverse().join(' ').trim() : '');

  const emailMatch = text.match(/EMAIL[^:]*:([^\r\n]+)/i);
  const phoneMatch = text.match(/TEL[^:]*:([^\r\n]+)/i);
  const orgMatch   = text.match(/ORG[^:]*:([^\r\n]+)/i);
  const titleMatch = text.match(/TITLE[^:]*:([^\r\n]+)/i);
  const urlMatch   = text.match(/URL[^:]*:([^\r\n]+)/i);

  return {
    name:    fullName,
    company: orgMatch   ? orgMatch[1].trim()   : '',
    role:    titleMatch ? titleMatch[1].trim()  : '',
    email:   emailMatch ? emailMatch[1].trim()  : '',
    phone:   phoneMatch ? phoneMatch[1].trim()  : '',
    country: '',
    _url:    urlMatch   ? urlMatch[1].trim()    : '',
    _raw:    text
  };
};

const QRScanner = ({ changeView, setExtractedData }) => {
  const { language } = useLanguage();
  const isES = language === 'es';

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const tickRef     = useRef(null);

  const [status, setStatus]       = useState('scanning'); // scanning | found | error
  const [qrResult, setQrResult]   = useState(null);
  const [camError, setCamError]   = useState('');
  const [parsedData, setParsedData] = useState(null);

  // Stop camera + animation loop
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Scan loop
  const tick = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tickRef.current);
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });
    if (code) {
      stopCamera();
      const raw = code.data;
      setQrResult(raw);
      const isVCard = raw.toUpperCase().startsWith('BEGIN:VCARD');
      const parsed  = isVCard
        ? parseVCard(raw)
        : { name: '', company: '', role: '', email: '', phone: '', country: '', _url: raw.startsWith('http') ? raw : '', _raw: raw };
      setParsedData(parsed);
      setStatus('found');
    } else {
      rafRef.current = requestAnimationFrame(tickRef.current);
    }
  }, [stopCamera]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Start camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(err => {
        console.error(err);
        setCamError(isES
          ? 'Cámara no disponible. Revisa los permisos del navegador.'
          : 'Camera unavailable. Check browser permissions.');
        setStatus('error');
      });
    return () => stopCamera();
  }, [tick, stopCamera, isES]);

  const handleProceed = () => {
    const d = parsedData || {};
    setExtractedData({
      name:    d.name    || '',
      company: d.company || '',
      role:    d.role    || '',
      email:   d.email   || '',
      phone:   d.phone   || '',
      country: d.country || ''
    });
    changeView('classification');
  };

  const handleRetry = () => {
    setStatus('scanning');
    setQrResult(null);
    setParsedData(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setStatus('error'));
  };

  // ── Error state ─────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="animation-fade" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <XCircle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#0B3A82', fontFamily: 'Outfit,system-ui,sans-serif', marginBottom: '8px' }}>
          {isES ? 'Sin acceso a cámara' : 'Camera Access Error'}
        </h2>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>{camError}</p>
        <button
          className="btn btn-secondary w-full"
          onClick={() => changeView('manual')}
        >
          {isES ? 'Ir a captura manual' : 'Go to manual entry'}
        </button>
      </div>
    );
  }

  // ── Found state ──────────────────────────────────────────────────────
  if (status === 'found' && parsedData) {
    const isVCard  = qrResult?.toUpperCase().startsWith('BEGIN:VCARD');
    const isURL    = !isVCard && (qrResult?.startsWith('http://') || qrResult?.startsWith('https://'));
    const hasData  = parsedData.name || parsedData.email || parsedData.company;

    return (
      <div className="animation-fade pb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <CheckCircle2 size={28} color="var(--snap-blue-sec)" />
          <h2 style={{
            margin: 0, fontSize: '18px', fontWeight: 800,
            color: 'var(--snap-blue-deep)',
            fontFamily: 'Outfit, system-ui, sans-serif'
          }}>
            {isES ? 'QR detectado' : 'QR Detected'}
          </h2>
        </div>

        <div style={{
          background: '#FFFFFF', borderRadius: '20px', padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isVCard ? 'vCard' : isURL ? 'URL' : isES ? 'Texto' : 'Text'}
          </p>

          {hasData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {parsedData.name    && <Row label={isES ? 'Nombre' : 'Name'}   value={parsedData.name} />}
              {parsedData.company && <Row label={isES ? 'Empresa' : 'Company'} value={parsedData.company} />}
              {parsedData.role    && <Row label={isES ? 'Cargo' : 'Role'}    value={parsedData.role} />}
              {parsedData.email   && <Row label="Email"                      value={parsedData.email} />}
              {parsedData.phone   && <Row label={isES ? 'Teléfono' : 'Phone'} value={parsedData.phone} />}
            </div>
          ) : (
            <p style={{
              fontSize: '13px', color: '#374151', background: '#F9FAFB',
              borderRadius: '8px', padding: '10px', wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {qrResult?.slice(0, 200)}{qrResult?.length > 200 ? '…' : ''}
            </p>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginBottom: '16px' }}>
          {isES
            ? 'Podrás editar y completar los datos en el siguiente paso.'
            : 'You can edit and complete the data in the next step.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn btn-primary w-full"
            style={{ justifyContent: 'space-between', height: '52px', fontSize: '15px' }}
            onClick={handleProceed}
          >
            <span>{isES ? 'Continuar a clasificación' : 'Continue to classification'}</span>
            <ChevronRight size={20} />
          </button>
          <button
            className="btn btn-secondary w-full"
            style={{ height: '44px', fontSize: '14px' }}
            onClick={handleRetry}
          >
            {isES ? 'Escanear otro QR' : 'Scan another QR'}
          </button>
        </div>
      </div>
    );
  }

  // ── Scanning state ───────────────────────────────────────────────────
  return (
    <div className="animation-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '12px',
          background: 'rgba(28,94,214,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <QrCode size={20} color="var(--snap-blue-sec)" />
        </div>
        <div>
          <h2 style={{
            margin: 0, fontSize: '18px', fontWeight: 800,
            color: 'var(--snap-blue-deep)',
            fontFamily: 'Outfit, system-ui, sans-serif'
          }}>
            {isES ? 'Lector QR' : 'QR Scanner'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
            {isES ? 'Apunta al código QR de la tarjeta' : 'Point at the business card QR code'}
          </p>
        </div>
      </div>

      {/* Camera preview */}
      <div style={{
        position: 'relative', width: '100%', paddingBottom: '75%',
        borderRadius: '20px', overflow: 'hidden',
        background: '#000', boxShadow: '0 8px 24px rgba(0,0,0,0.20)'
      }}>
        <video
          ref={videoRef}
          muted playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Scan overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '60%', aspectRatio: '1',
            border: '2px solid rgba(255,255,255,0.70)',
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            position: 'relative'
          }}>
            {/* Corner marks */}
            {['topLeft','topRight','bottomLeft','bottomRight'].map(pos => (
              <div key={pos} style={{
                position: 'absolute',
                width: 20, height: 20,
                borderColor: 'var(--snap-blue-light)',
                borderStyle: 'solid',
                borderWidth: 0,
                ...(pos === 'topLeft'     && { top: -2, left: -2,  borderTopWidth: 3, borderLeftWidth: 3,  borderTopLeftRadius: 8 }),
                ...(pos === 'topRight'    && { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }),
                ...(pos === 'bottomLeft'  && { bottom: -2, left: -2,  borderBottomWidth: 3, borderLeftWidth: 3,  borderBottomLeftRadius: 8 }),
                ...(pos === 'bottomRight' && { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 })
              }} />
            ))}
            {/* Scan line */}
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 2,
              background: 'var(--snap-blue-light)',
              boxShadow: '0 0 10px var(--snap-blue-light)',
              animation: 'scan 2s linear infinite'
            }} />
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0%{top:4%} 50%{top:96%} 100%{top:4%} }` }} />
      </div>

      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', marginTop: '16px' }}>
        {isES
          ? 'Mantén el QR dentro del recuadro. Detección automática.'
          : 'Keep the QR within the frame. Auto-detection enabled.'}
      </p>

      <button
        className="btn btn-secondary w-full"
        style={{ marginTop: '12px', height: '44px', fontSize: '14px' }}
        onClick={() => { stopCamera(); changeView('manual'); }}
      >
        {isES ? 'Ir a captura manual' : 'Switch to manual entry'}
      </button>
    </div>
  );
};

// Small helper row component
const Row = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, minWidth: '70px', paddingTop: '1px' }}>
      {label}
    </span>
    <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500, wordBreak: 'break-all' }}>
      {value}
    </span>
  </div>
);

export default QRScanner;
