import React, { useState } from 'react';
import { X, Save, Key, Globe, CheckCircle2, Edit2 } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const HAS_ENV_KEY = Boolean(
  import.meta.env.VITE_GEMINI_API_KEY &&
  import.meta.env.VITE_GEMINI_API_KEY !== 'REEMPLAZA_CON_TU_API_KEY'
);

const SettingsModal = ({ onClose }) => {
  const { t, language, changeLanguage } = useLanguage();
  const isES = language === 'es';
  const [apiKey, setApiKey] = useState(() => (
    HAS_ENV_KEY ? '' : localStorage.getItem('geminiApiKey') || ''
  ));
  const [hasKey, setHasKey] = useState(() => (
    HAS_ENV_KEY || Boolean(localStorage.getItem('geminiApiKey'))
  ));
  const [isEditing, setIsEditing] = useState(() => (
    !HAS_ENV_KEY && !localStorage.getItem('geminiApiKey')
  ));

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', apiKey.trim());
    setHasKey(true);
    setIsEditing(false);
  };

  return (
    <div
      className="animation-fade"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '1rem'
      }}
    >
      <div className="glass-panel w-full" style={{ maxWidth: '350px' }}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl flex items-center gap-2 m-0 p-0 text-[var(--snap-blue-deep)]">
            <Key size={20} className="text-[var(--snap-blue-sec)]" />
            {t('settings_title')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6 font-medium">
          {t('settings_desc')}
        </p>

        {/* Language selector */}
        <div className="form-group mb-4">
          <label className="form-label flex items-center gap-2 text-gray-700">
            <Globe size={14} /> {t('language_label')}
          </label>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
            <button
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all focus:outline-none ${language === 'es' ? 'bg-white shadow-sm text-[var(--snap-blue-deep)]' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => changeLanguage('es')}
            >
              Español
            </button>
            <button
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all focus:outline-none ${language === 'en' ? 'bg-white shadow-sm text-[var(--snap-blue-deep)]' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => changeLanguage('en')}
            >
              English
            </button>
          </div>
        </div>

        {/* API Key section */}
        <div className="form-group mt-6 p-5 rounded-xl border border-gray-200 bg-gray-50 shadow-inner block">
          {HAS_ENV_KEY ? (
            /* Key configured by admin via .env — show status only, no editing */
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="text-sm font-bold text-green-700">{t('api_configured')}</span>
              </div>
              <p className="text-xs text-gray-400 text-center">
                {isES
                  ? 'Configurada por el administrador. Contacta a IT para cambiarla.'
                  : 'Configured by administrator. Contact IT to change it.'}
              </p>
            </div>
          ) : !isEditing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                {hasKey ? (
                  <>
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span className="text-sm font-bold text-green-700">{t('api_configured')}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-red-500">{t('api_not_configured')}</span>
                )}
              </div>
              <button
                className="btn btn-secondary w-full flex justify-center gap-2 text-sm bg-white"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={16} className="text-gray-400" />
                {t('edit_api')}
              </button>
            </div>
          ) : (
            <div>
              <label className="form-label text-gray-700">{t('api_label')}</label>
              <input
                type="password"
                className="form-input bg-white"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                {hasKey && (
                  <button
                    className="btn flex-1 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                    onClick={() => setIsEditing(false)}
                  >
                    {t('cancel')}
                  </button>
                )}
                <button
                  className="btn flex-1 bg-[var(--snap-blue-deep)] text-white font-semibold text-sm hover:bg-[var(--snap-blue-sec)] flex justify-center gap-2"
                  onClick={handleSave}
                >
                  <Save size={16} />
                  {t('save_settings')}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
