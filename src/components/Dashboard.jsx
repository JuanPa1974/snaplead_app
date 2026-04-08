import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const { t, language } = useLanguage();

  const isES = language === 'es';

  const copy = {
    eventSetupTitle: isES ? 'Configuración del evento' : 'Event Setup',
    eventSetupDesc: isES
      ? 'Define el contexto del evento para esta sesión de captura'
      : 'Define the event context for this lead capture session',
    eventName: isES ? 'Nombre del evento' : 'Event Name',
    eventYear: isES ? 'Año del evento' : 'Event Year',
    startDate: isES ? 'Fecha de inicio' : 'Start Date',
    endDate: isES ? 'Fecha de fin' : 'End Date',
    saveEvent: isES ? 'Guardar evento' : 'Save Event',
    resetEvent: isES ? 'Reset evento' : 'Reset Event',
    editEvent: isES ? 'Editar' : 'Edit',
    eventSaved: isES ? 'Evento guardado correctamente' : 'Event saved successfully',
    confirmReset: isES
      ? '¿Seguro que deseas resetear los datos del evento?'
      : 'Are you sure you want to reset the event data?',
    summaryPrefix: isES ? 'Evento' : 'Event',
    from: isES ? 'del' : 'from',
    to: isES ? 'al' : 'to',
    dashboardSubtitle: isES ? 'Actividad de leads de hoy' : 'Today’s lead activity',
    noEventConfigured: isES ? 'Configura el evento para comenzar' : 'Set up the event to begin'
  };

  const [stats, setStats] = useState({
    total: 0,
    highOpp: 0,
    byCountry: [],
    byType: []
  });

  const [eventData, setEventData] = useState({
    eventName: '',
    eventYear: '',
    startDate: '',
    endDate: ''
  });

  const [eventConfigured, setEventConfigured] = useState(false);
  const [editingEvent, setEditingEvent] = useState(true);

  useEffect(() => {
    const savedEvent = JSON.parse(localStorage.getItem('snapleadEvent') || '{}');

    const normalizedEvent = {
      eventName: savedEvent.eventName || '',
      eventYear: savedEvent.eventYear || '',
      startDate: savedEvent.startDate || '',
      endDate: savedEvent.endDate || ''
    };

    setEventData(normalizedEvent);

    const hasEvent =
      normalizedEvent.eventName &&
      normalizedEvent.eventYear &&
      normalizedEvent.startDate &&
      normalizedEvent.endDate;

    setEventConfigured(Boolean(hasEvent));
    setEditingEvent(!hasEvent);

    const leads = JSON.parse(localStorage.getItem('snapleadLeads') || '[]');
    const today = new Date().toLocaleDateString();

    const todaysLeads = leads.filter((l) => {
      if (!l || !l.timestamp) return false;
      const d = new Date(l.timestamp);
      if (isNaN(d.getTime())) return false;
      return d.toLocaleDateString() === today;
    });

    const countryMap = {};
    const typeMap = {};

    todaysLeads.forEach((l) => {
      const c = l.country ? l.country.trim().toUpperCase() : 'UNKNOWN';
      countryMap[c] = (countryMap[c] || 0) + 1;

      const tVal = l.contact_type || 'unknown';
      typeMap[tVal] = (typeMap[tVal] || 0) + 1;
    });

    const byCountryList = Object.entries(countryMap || {}).map(([name, count]) => ({
      name,
      count
    }));

    const byTypeList = Object.entries(typeMap || {}).map(([name, count]) => ({
      name,
      count
    }));

    setStats({
      total: todaysLeads.length || 0,
      highOpp: todaysLeads.filter((l) => l.opportunity_level === 'high').length || 0,
      byCountry: Array.isArray(byCountryList) ? byCountryList : [],
      byType: Array.isArray(byTypeList) ? byTypeList : []
    });
  }, []);

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEvent = () => {
    const cleaned = {
      eventName: eventData.eventName.trim(),
      eventYear: eventData.eventYear.trim(),
      startDate: eventData.startDate,
      endDate: eventData.endDate
    };

    localStorage.setItem('snapleadEvent', JSON.stringify(cleaned));
    setEventData(cleaned);
    setEventConfigured(true);
    setEditingEvent(false);
    alert(copy.eventSaved);
  };

  const handleResetEvent = () => {
    const confirmed = window.confirm(copy.confirmReset);
    if (!confirmed) return;

    const cleared = {
      eventName: '',
      eventYear: '',
      startDate: '',
      endDate: ''
    };

    setEventData(cleared);
    setEventConfigured(false);
    setEditingEvent(true);
    localStorage.setItem('snapleadEvent', JSON.stringify(cleared));
  };

  // ── Backup / Restore ────────────────────────────────────────────────
  const handleExportBackup = () => {
    const leads = JSON.parse(localStorage.getItem('snapleadLeads') || '[]');
    const event = JSON.parse(localStorage.getItem('snapleadEvent') || '{}');
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      event,
      leads
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snaplead-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const backup = JSON.parse(evt.target.result);
        if (!backup.leads || !Array.isArray(backup.leads)) {
          alert(isES ? 'Archivo inválido: no se encontraron leads.' : 'Invalid file: no leads found.');
          return;
        }
        const confirmed = window.confirm(
          isES
            ? `¿Restaurar ${backup.leads.length} leads del backup del ${backup.exportedAt?.slice(0, 10) || '?'}? Esto SOBRESCRIBIRÁ los datos actuales.`
            : `Restore ${backup.leads.length} leads from backup dated ${backup.exportedAt?.slice(0, 10) || '?'}? This will OVERWRITE current data.`
        );
        if (!confirmed) return;
        localStorage.setItem('snapleadLeads', JSON.stringify(backup.leads));
        if (backup.event) localStorage.setItem('snapleadEvent', JSON.stringify(backup.event));
        alert(isES ? 'Backup restaurado correctamente. Recarga la página.' : 'Backup restored. Please reload the page.');
      } catch {
        alert(isES ? 'Error al leer el archivo de backup.' : 'Error reading backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    return isES
      ? d.toLocaleDateString('es-ES')
      : d.toLocaleDateString('en-US');
  };

  const panelStyle = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '18px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
  };

  const inputStyle = {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #D1D5DB',
    background: '#FFFFFF',
    padding: '0 14px',
    fontSize: '15px',
    color: '#111827',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 700,
    color: '#4B5563',
    marginBottom: '8px'
  };

  const secondaryButtonStyle = {
    height: '42px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    background: '#FFFFFF',
    color: '#1A1A1A',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px'
  };

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100%', padding: '0' }}>
      {!eventConfigured || editingEvent ? (
        <div style={panelStyle}>
          <h2 style={{ color: '#0B3A82', margin: 0, fontSize: '24px', fontWeight: 800 }}>
            {copy.eventSetupTitle}
          </h2>
          <p style={{ color: '#555', marginTop: '6px', marginBottom: '18px' }}>
            {copy.eventSetupDesc}
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{copy.eventName}</label>
            <input
              type="text"
              name="eventName"
              value={eventData.eventName}
              onChange={handleEventChange}
              style={inputStyle}
              placeholder={isES ? 'Ej: Alimentaria' : 'e.g. Alimentaria'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{copy.eventYear}</label>
            <input
              type="text"
              name="eventYear"
              value={eventData.eventYear}
              onChange={handleEventChange}
              style={inputStyle}
              placeholder={isES ? 'Ej: 2026' : 'e.g. 2026'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{copy.startDate}</label>
            <input
              type="date"
              name="startDate"
              value={eventData.startDate}
              onChange={handleEventChange}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>{copy.endDate}</label>
            <input
              type="date"
              name="endDate"
              value={eventData.endDate}
              onChange={handleEventChange}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveEvent}
              style={{
                flex: 1,
                height: '50px',
                border: 'none',
                borderRadius: '14px',
                background: '#1C5ED6',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(28, 94, 214, 0.25)'
              }}
            >
              {copy.saveEvent}
            </button>

            {eventConfigured && (
              <button
                onClick={() => setEditingEvent(false)}
                style={{
                  flex: 1,
                  height: '50px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isES ? 'Cancelar' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            ...panelStyle,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: '#0B3A82',
                fontSize: '15px',
                fontWeight: 800,
                marginBottom: '4px'
              }}
            >
              {copy.summaryPrefix}: {eventData.eventName} {eventData.eventYear}
            </div>
            <div
              style={{
                color: '#6B7280',
                fontSize: '13px',
                lineHeight: 1.4
              }}
            >
              {copy.from} {formatDate(eventData.startDate)} {copy.to} {formatDate(eventData.endDate)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditingEvent(true)}
              style={secondaryButtonStyle}
            >
              {copy.editEvent}
            </button>

            <button
              onClick={handleResetEvent}
              style={secondaryButtonStyle}
            >
              {copy.resetEvent}
            </button>
          </div>
        </div>
      )}

      <div style={panelStyle}>
        <h2 style={{ color: '#0B3A82', margin: 0, fontSize: '28px', fontWeight: 700 }}>
          {t('daily_summary')}
        </h2>
        <p style={{ color: '#555', marginTop: '6px', marginBottom: '18px' }}>
          {copy.dashboardSubtitle}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              flex: 1,
              background: '#0B3A82',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '18px'
            }}
          >
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              {t('total_leads')}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.total}</div>
          </div>

          <div
            style={{
              flex: 1,
              background: '#1C5ED6',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '18px'
            }}
          >
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              {t('high_opp')}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.highOpp}</div>
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <h3 style={{ color: '#0B3A82', marginTop: 0, marginBottom: '14px' }}>
          {t('by_country')}
        </h3>

        {stats.byCountry.length > 0 ? (
          stats.byCountry.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i !== stats.byCountry.length - 1 ? '1px solid #EEE' : 'none'
              }}
            >
              <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: '#555' }}>{c.count}</span>
            </div>
          ))
        ) : (
          <div style={{ color: '#777' }}>{t('no_data')}</div>
        )}
      </div>

      <div style={panelStyle}>
        <h3 style={{ color: '#0B3A82', marginTop: 0, marginBottom: '14px' }}>
          {t('by_type')}
        </h3>

        {stats.byType.length > 0 ? (
          stats.byType.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i !== stats.byType.length - 1 ? '1px solid #EEE' : 'none'
              }}
            >
              <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{item.name}</span>
              <span style={{ color: '#555' }}>{item.count}</span>
            </div>
          ))
        ) : (
          <div style={{ color: '#777' }}>{t('no_data')}</div>
        )}
      </div>

      {/* ── Data Backup Panel ─────────────────────────────────────── */}
      <div
        style={{
          ...panelStyle,
          border: '1px solid #E0E7FF',
          background: 'rgba(238,242,255,0.6)'
        }}
      >
        <h3 style={{ color: '#0B3A82', marginTop: 0, marginBottom: '6px', fontSize: '15px' }}>
          {isES ? '🔒 Copia de seguridad' : '🔒 Data Backup'}
        </h3>
        <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '14px' }}>
          {isES
            ? 'Exporta tus leads a un archivo JSON para protegerlos. Importa para restaurar.'
            : 'Export your leads to a JSON file as backup. Import to restore.'}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportBackup}
            style={{
              flex: 1,
              height: '44px',
              border: 'none',
              borderRadius: '12px',
              background: '#1C5ED6',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(28,94,214,0.22)'
            }}
          >
            ⬇ {isES ? 'Exportar' : 'Export'}
          </button>
          <label
            style={{
              flex: 1,
              height: '44px',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              background: '#FFFFFF',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            ⬆ {isES ? 'Restaurar' : 'Restore'}
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportBackup}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;