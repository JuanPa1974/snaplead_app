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
      className="camera-view"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'black',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          zIndex: 10
        }}
      >
        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
          {t('align_card')}
        </h2>

        <button
          onClick={cancel}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '8px',
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
          justifyContent: 'center'
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
                objectFit: 'cover'
              }}
            />

            {/* MARCO */}
            <div
              style={{
                position: 'absolute',
                inset: '20% 10%',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: '16px'
              }}
            />

            {/* BOTÓN DISPARADOR CENTRADO */}
            <div
              style={{
                position: 'absolute',
                bottom: '120px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <button
                onClick={captureImage}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '6px solid #1C5ED6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  cursor: 'pointer'
                }}
              >
                <Camera size={36} color="#0B3A82" />
              </button>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCapture;
