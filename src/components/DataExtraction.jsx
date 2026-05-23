import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

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

    // Admin key (build-time) takes priority; localStorage only for manual override
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('geminiApiKey');
    if (!apiKey || apiKey === 'REEMPLAZA_CON_TU_API_KEY') {
      setErrorObj(t('missing_api'));
      setIsExtracting(false);
      return;
    }

    try {
      const base64Data = image.split(',')[1];
      
      const payload = {
        contents: [{
          parts: [
            { text: "Extract the following details from this business card: name, company, role, email, phone, country. Return ONLY a valid JSON object." },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error details:", errorBody);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textOutput) {
        const start = textOutput.indexOf('{');
        const end = textOutput.lastIndexOf('}');
        if (start === -1 || end === -1) {
          throw new Error("Invalid output format: JSON object not found");
        }
        
        const jsonStr = textOutput.slice(start, end + 1);
        const extractedJson = JSON.parse(jsonStr);
        
        setFormData(prev => ({
          ...prev,
          name: extractedJson.name || prev.name,
          company: extractedJson.company || prev.company,
          role: extractedJson.role || prev.role,
          email: extractedJson.email || prev.email,
          phone: extractedJson.phone || prev.phone,
          country: extractedJson.country || prev.country
        }));
      } else {
         setErrorObj("Failed to extract data properly. Manual entry required.");
      }
    } catch (err) {
      console.error("Gemini API Exception:", err);
      setErrorObj(err.message || "Failed to contact AI service.");
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
      <div className="glass-panel text-center flex flex-col items-center justify-center py-12 h-full min-h-[400px]">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'var(--primary-glow)' }}></div>
          <div className="relative bg-[#F3F4F6] p-6 rounded-full border border-[var(--snap-blue-sec)]">
            <BrainCircuit size={48} className="text-[var(--snap-blue-sec)]" style={{ animation: 'pulse-glow 2s infinite' }} />
          </div>
        </div>
        <h2 className="mb-2 text-xl text-[var(--snap-blue-deep)] font-semibold">{t('processing')}</h2>
        <p className="text-muted">{t('processing_desc')}</p>
        
        {image && (
          <div className="mt-8 relative w-48 h-28 rounded-md overflow-hidden border border-gray-200 shadow-sm">
             <img src={image} alt="Card Preview" className="w-full h-full object-cover opacity-80" />
             <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--snap-blue-sec)] shadow-[0_0_10px_var(--snap-blue-sec)]" 
                  style={{ animation: 'scan 2s linear infinite' }}></div>
          </div>
        )}
        <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}} />
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
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg mb-4 text-sm font-medium">
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
