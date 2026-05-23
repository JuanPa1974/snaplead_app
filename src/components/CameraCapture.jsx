import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const CameraCapture = ({ changeView, setCapturedImage }) => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    }).then((mediaStream) => {
      if (!isMounted) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    }).catch((err) => {
      console.error('Error accessing camera', err);
      if (isMounted) setError(true);
    });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/jpeg');

      setCapturedImage(imgData);
      stopCamera();
      changeView('extraction');
    }
  };

  const cancel = () => {
    stopCamera();
    changeView('dashboard');
  };

  return (
    <div
      className="camera-view camera-premium"
      style={{
        position: 'fixed',
        inset: 0,
        minHeight: '100dvh',
        height: '100dvh',
        background: '#05070A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000
      }}
    >
      {/* HEADER */}
      <div
        className="camera-premium-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'calc(16px + env(safe-area-inset-top)) 16px 16px',
          background: 'linear-gradient(to bottom, rgba(5,7,10,0.82), transparent)',
          flexShrink: 0,
          zIndex: 30
        }}
      >
        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 700, letterSpacing: 0 }}>
          {t('align_card')}
        </h2>

        <button
          className="camera-close-btn"
          onClick={cancel}
          style={{
            background: 'rgba(18,26,36,0.72)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '14px',
            padding: '9px',
            backdropFilter: 'blur(18px)',
            cursor: 'pointer'
          }}
        >
          <X size={24} color="white" />
        </button>
      </div>

      {/* VIDEO */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0
        }}
      >
        {error ? (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <p>{t('camera_error')}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'contrast(1.04) saturate(0.95)'
              }}
            />
            <div
              className="camera-cinematic-mask"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none'
              }}
            />

            {/* MARCO */}
            <div
              className="camera-card-frame"
              style={{
                position: 'absolute',
                inset: '18% 8% calc(118px + env(safe-area-inset-bottom))',
              }}
            >
              <span>{t('align_card')}</span>
            </div>
          </>
        )}
      </div>

      {!error && (
        <div
          className="camera-control-bar"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '18px 18px calc(24px + env(safe-area-inset-bottom))',
            background: 'linear-gradient(180deg, transparent, rgba(5,7,10,0.88) 28%, rgba(5,7,10,0.96))',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 40
          }}
        >
          <button
            className="camera-shutter"
            onClick={captureImage}
            aria-label={t('align_card')}
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFFFFF, #EEF1F5)',
              border: '6px solid #F97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 55px rgba(0,0,0,0.38), 0 0 34px rgba(249,115,22,0.18)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
              zIndex: 45
            }}
          >
            <Camera size={36} color="#0B1F3A" />
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCapture;
