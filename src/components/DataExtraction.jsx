import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';
import { extractLeadData } from '../services/geminiClient';

const DataExtraction = ({ image, changeView, setExtractedData }) => {
  const { t } = useLanguage();
  const [isExtracting, setIsExtracting] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [formData, setFormData] = useState({
    name: '', company: '', role: '', email: '', phone: '', country: ''
  });

  const extractData = useCallback(async () => {
    if (!image) {
      setIsExtracting(false);
      return;
    }

    try {
      const extractedJson = await extractLeadData(image);

      setFormData(prev => ({
        ...prev,
        name: extractedJson.name || prev.name,
        company: extractedJson.company || prev.company,
        role: extractedJson.role || prev.role,
        email: extractedJson.email || prev.email,
        phone: extractedJson.phone || prev.phone,
        country: extractedJson.country || prev.country
      }));
    } catch (err) {
      setErrorObj(err.message || t('missing_api'));
    } finally {
      setIsExtracting(false);
    }
  }, [image, t]);

  useEffect(() => {
    extractData();
  }, [extractData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setExtractedData(formData);
    changeView('classification');
  };

  if (isExtracting) {
    return (
      <div className="glass-panel ai-processing text-center flex flex-col items-center justify-center py-12 h-full min-h-[400px]">
        <div className="ai-orb mb-6">
          <BrainCircuit size={34} />
        </div>
        <h2 className="mb-2 text-xl text-[var(--snap-blue-deep)] font-semibold">{t('processing')}</h2>
        <p className="text-muted">{t('processing_desc')}</p>
        <div className="skeleton-stack">
          <div className="skeleton-line"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line short"></div>
        </div>
        
        {image && (
          <div className="ai-preview-card mt-8 relative w-48 h-28 rounded-md overflow-hidden border border-gray-200 shadow-sm">
             <img src={image} alt="Card Preview" className="w-full h-full object-cover opacity-80" />
             <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--snap-blue-sec)] shadow-[0_0_10px_var(--snap-blue-sec)]" 
                  style={{ animation: 'scan-card 2s linear infinite' }}></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animation-fade pb-10">
      <div className="flex items-center gap-2 mb-6">
        {errorObj ? (
          <AlertTriangle size={24} className="text-yellow-500" />
        ) : (
          <CheckCircle2 size={24} className="text-[var(--snap-blue-sec)]" />
        )}
        <h2 className="text-xl text-[var(--snap-blue-deep)]">{errorObj ? t('manual_entry') : t('extract_complete')}</h2>
      </div>
      
      {errorObj && (
        <div className="premium-error bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg mb-4 text-sm font-medium">
          {errorObj}
        </div>
      )}

      <div className="glass-panel border-t-4 border-t-[var(--snap-blue-sec)]">
        <p className="text-sm text-muted mb-4">{t('review_desc')}</p>
        
        <div className="form-group">
          <label className="form-label">{t('name')}</label>
          <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('company')}</label>
            <input type="text" className="form-input" name="company" value={formData.company} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">{t('role')}</label>
            <input type="text" className="form-input" name="role" value={formData.role} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('email')}</label>
            <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">{t('phone')}</label>
            <input type="tel" className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('country')}</label>
          <input type="text" className="form-input" name="country" value={formData.country} onChange={handleChange} />
        </div>

        <button className="btn btn-primary w-full mt-4 justify-between" onClick={handleNext}>
          <span>{t('continue')}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DataExtraction;
