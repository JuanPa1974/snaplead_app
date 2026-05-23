import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const LeadClassification = ({ data, changeView }) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    contact_type: 'client',
    interest: 'products',
    opportunity_level: 'medium',
    next_action: 'follow up',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const newLead = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...data,
      ...formData
    };

    const existingLeads = JSON.parse(localStorage.getItem('snapleadLeads') || '[]');
    localStorage.setItem('snapleadLeads', JSON.stringify([newLead, ...existingLeads]));

    changeView('dashboard');
  };

  const fieldBlockStyle = {
    marginBottom: '18px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '15px',
    fontWeight: 500,
    color: '#B6C0CF',
    marginBottom: '10px'
  };

  const selectStyle = {
    width: '100%',
    height: '50px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(18,26,36,0.56)',
    padding: '0 14px',
    fontSize: '16px',
    color: '#FFFFFF',
    outline: 'none'
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '130px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(18,26,36,0.56)',
    padding: '14px',
    fontSize: '16px',
    color: '#FFFFFF',
    outline: 'none',
    resize: 'vertical'
  };

  const panelStyle = {
    background: 'rgba(42,54,71,0.78)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '24px',
    padding: '22px',
    marginBottom: '18px',
    boxShadow: '0 18px 48px rgba(0,0,0,0.20)',
    backdropFilter: 'blur(18px)'
  };

  const buttonStyle = {
    width: '100%',
    height: '58px',
    border: 'none',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #F97316, #D97706)',
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 16px 38px rgba(249, 115, 22, 0.24)',
    cursor: 'pointer',
    letterSpacing: '0'
  };

  return (
    <div style={{ padding: '0 0 10px 0' }}>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#FFFFFF',
          marginBottom: '18px',
          lineHeight: 1.15
        }}
      >
        {t('class_title')}
      </h2>

      <div style={panelStyle}>
        <div style={fieldBlockStyle}>
          <label style={labelStyle}>{t('contact_type')}</label>
          <select
            name="contact_type"
            value={formData.contact_type}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="client">{t('opt_client')}</option>
            <option value="distributor">{t('opt_distrib')}</option>
            <option value="horeca">{t('opt_horeca')}</option>
            <option value="retail">{t('opt_retail')}</option>
            <option value="partner">{t('opt_partner')}</option>
          </select>
        </div>

        <div style={fieldBlockStyle}>
          <label style={labelStyle}>{t('interest')}</label>
          <select
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="distribution">{t('opt_dist')}</option>
            <option value="products">{t('opt_prod')}</option>
            <option value="private label">{t('opt_marca')}</option>
            <option value="horeca">{t('opt_horeca')}</option>
            <option value="retail">{t('opt_retail')}</option>
          </select>
        </div>

        <div style={fieldBlockStyle}>
          <label style={labelStyle}>{t('opp_level')}</label>
          <select
            name="opportunity_level"
            value={formData.opportunity_level}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="high">{t('opt_high')}</option>
            <option value="medium">{t('opt_medium')}</option>
            <option value="low">{t('opt_low')}</option>
          </select>
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>{t('next_action')}</label>
          <select
            name="next_action"
            value={formData.next_action}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="call">{t('opt_call')}</option>
            <option value="meeting">{t('opt_meet')}</option>
            <option value="send catalog">{t('opt_catalog')}</option>
            <option value="follow up">{t('opt_follow')}</option>
          </select>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>{t('notes')}</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={textareaStyle}
          />
        </div>
      </div>

      <button onClick={handleSave} style={buttonStyle}>
        <Save size={20} />
        {t('save_lead')}
      </button>
    </div>
  );
};

export default LeadClassification;
