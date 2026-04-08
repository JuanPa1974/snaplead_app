import React, { useState } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Simple validators
const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => !v || /^[+\d\s\-().]{6,20}$/.test(v);

const ManualCapture = ({ changeView, setExtractedData }) => {
  const { t, language } = useLanguage();
  const isES = language === 'es';

  const [form, setForm] = useState({
    name: '', company: '', role: '', email: '', phone: '', country: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error on edit
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = isES ? 'El nombre es obligatorio' : 'Name is required';
    }
    if (!isValidEmail(form.email)) {
      errs.email = isES ? 'Correo no válido' : 'Invalid email';
    }
    if (!isValidPhone(form.phone)) {
      errs.phone = isES ? 'Teléfono no válido' : 'Invalid phone';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setExtractedData(form);
    changeView('classification');
  };

  const fieldStyle = (hasError) => ({
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
    background: '#FFFFFF',
    padding: '0 14px',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Inter, system-ui, sans-serif'
  });

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#4B5563',
    marginBottom: '6px'
  };

  const errorStyle = {
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '4px',
    fontWeight: 500
  };

  return (
    <div className="animation-fade pb-10">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'rgba(28,94,214,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <User size={20} color="var(--snap-blue-sec)" />
        </div>
        <div>
          <h2 style={{
            margin: 0, fontSize: '18px', fontWeight: 800,
            color: 'var(--snap-blue-deep)',
            fontFamily: 'Outfit, system-ui, sans-serif'
          }}>
            {isES ? 'Captura Manual' : 'Manual Capture'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
            {isES ? 'Ingresa los datos directamente' : 'Enter contact details directly'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid #F0F0F0'
        }}
      >
        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>{t('name')} *</label>
          <input
            type="text" name="name" value={form.name}
            onChange={handleChange} style={fieldStyle(errors.name)}
            placeholder={isES ? 'Ej: Carlos García' : 'e.g. John Smith'}
            autoFocus
          />
          {errors.name && <p style={errorStyle}>{errors.name}</p>}
        </div>

        {/* Company + Role */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>{t('company')}</label>
            <input
              type="text" name="company" value={form.company}
              onChange={handleChange} style={fieldStyle(false)}
              placeholder={isES ? 'Empresa' : 'Company'}
            />
          </div>
          <div>
            <label style={labelStyle}>{t('role')}</label>
            <input
              type="text" name="role" value={form.role}
              onChange={handleChange} style={fieldStyle(false)}
              placeholder={isES ? 'Cargo' : 'Role'}
            />
          </div>
        </div>

        {/* Email + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>{t('email')}</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} style={fieldStyle(errors.email)}
              placeholder="email@..."
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>
          <div>
            <label style={labelStyle}>{t('phone')}</label>
            <input
              type="tel" name="phone" value={form.phone}
              onChange={handleChange} style={fieldStyle(errors.phone)}
              placeholder="+34 6..."
            />
            {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
          </div>
        </div>

        {/* Country */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>{t('country')}</label>
          <input
            type="text" name="country" value={form.country}
            onChange={handleChange} style={fieldStyle(false)}
            placeholder={isES ? 'País' : 'Country'}
          />
        </div>

        {/* CTA */}
        <button
          className="btn btn-primary w-full"
          style={{ justifyContent: 'space-between', height: '52px', fontSize: '15px' }}
          onClick={handleNext}
        >
          <span>{t('continue')}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ManualCapture;
