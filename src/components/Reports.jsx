import React, { useEffect, useState } from 'react';
import {
  DownloadCloud,
  Trash2,
  Calendar,
  Search,
  Building2,
  MapPin,
  Sparkles,
  X,
  Copy,
  Check
} from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const Reports = () => {
  const { t, language } = useLanguage();

  const isES = language === 'es';

  const copy = {
    reportGeneratedFor: isES ? 'Informe generado para' : 'Report generated for',
    activeEvent: isES ? 'Evento activo' : 'Active event',
    eventNotConfigured: isES ? 'Sin evento activo configurado' : 'No active event configured',
    from: isES ? 'del' : 'from',
    to: isES ? 'al' : 'to',
    csvFileNamePrefix: 'snaplead-export',
    clearLeadsOnly: isES ? 'Borrar contactos guardados' : 'Delete saved contacts',
    noEventContext: isES
      ? 'Se generará el informe con todos los leads guardados'
      : 'The report will be generated using all saved leads',
    aiNoOutput: isES ? 'La IA no devolvió contenido.' : 'The AI did not return any content.',
    aiFailed: isES ? 'No se pudo generar el informe.' : 'Failed to generate report.',
    executivePrompt: isES
      ? 'Actúa como un gerente senior de ferias y desarrollo de negocio B2B. Analiza los leads captados en este evento y genera un informe ejecutivo profesional en español.'
      : 'Act as a senior B2B trade show and business development manager. Analyze the leads captured during this event and generate a professional executive report in English.',
    headingsPrompt: isES
      ? `Usa ESTRICTAMENTE estos 4 encabezados en Markdown:
## Resumen Ejecutivo
## Métricas Clave
## Insights Comerciales
## Próximas Acciones`
      : `Use STRICTLY these 4 headings in Markdown:
## Executive Summary
## Key Metrics
## Business Insights
## Recommended Next Actions`,
    eventContextPrompt: isES ? 'Evento activo' : 'Active event',
    leadsPrompt: isES ? 'Estos son los leads analizados' : 'These are the analyzed leads',
    noLeadsAvailable: isES
      ? 'No hay leads guardados para generar el informe.'
      : 'There are no saved leads to generate the report.',
    reportTypeLabel: isES ? 'Informe IA del evento' : 'Event AI Report',
    leadsInAnalysis: isES ? 'Leads incluidos' : 'Leads included'
  };

  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventContext, setEventContext] = useState({
    eventName: '',
    eventYear: '',
    startDate: '',
    endDate: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    loadLeads();
    loadEventContext();
  }, []);

  const loadLeads = () => {
    const data = JSON.parse(localStorage.getItem('snapleadLeads') || '[]');
    setLeads(data);
  };

  const loadEventContext = () => {
    const savedEvent = JSON.parse(localStorage.getItem('snapleadEvent') || '{}');
    setEventContext({
      eventName: savedEvent.eventName || '',
      eventYear: savedEvent.eventYear || '',
      startDate: savedEvent.startDate || '',
      endDate: savedEvent.endDate || ''
    });
  };

  const clearAll = () => {
    if (confirm(t('confirm_delete'))) {
      localStorage.removeItem('snapleadLeads');
      setLeads([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return isES ? d.toLocaleDateString('es-ES') : d.toLocaleDateString('en-US');
  };

  const hasActiveEvent =
    eventContext.eventName &&
    eventContext.eventYear &&
    eventContext.startDate &&
    eventContext.endDate;

  const getEventSummaryText = () => {
    if (!hasActiveEvent) return copy.eventNotConfigured;

    return `${eventContext.eventName} ${eventContext.eventYear} · ${copy.from} ${formatDate(
      eventContext.startDate
    )} ${copy.to} ${formatDate(eventContext.endDate)}`;
  };

  const exportCSV = () => {
    if (leads.length === 0) return;

    const headers =
      'Date,Event Name,Event Year,Name,Company,Role,Email,Phone,Country,Contact Type,Interest,Opportunity Level,Next Action,Notes\n';

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      headers +
      leads
        .map((e) => {
          const clean = (str) => {
            if (!str) return '';
            return `"${String(str).replace(/"/g, '""')}"`;
          };

          return [
            clean(new Date(e.timestamp).toLocaleDateString()),
            clean(eventContext.eventName),
            clean(eventContext.eventYear),
            clean(e.name),
            clean(e.company),
            clean(e.role),
            clean(e.email),
            clean(e.phone),
            clean(e.country),
            clean(e.contact_type),
            clean(e.interest),
            clean(e.opportunity_level),
            clean(e.next_action),
            clean(e.notes)
          ].join(',');
        })
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${copy.csvFileNamePrefix}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLeadsForReport = () => {
    return leads.filter((l) => l && l.timestamp);
  };

  const generateDailyReport = async () => {
    const apiKey = localStorage.getItem('geminiApiKey');

    if (!apiKey) {
      alert(t('missing_api'));
      return;
    }

    const leadsForReport = getLeadsForReport();

    if (leadsForReport.length === 0) {
      alert(copy.noLeadsAvailable);
      return;
    }

    setIsGenerating(true);
    setShowReport(true);
    setReportResult(null);
    setReportError(null);
    setCopied(false);

    try {
      const eventBlock = hasActiveEvent
        ? `${copy.eventContextPrompt}:
- ${isES ? 'Nombre del evento' : 'Event name'}: ${eventContext.eventName}
- ${isES ? 'Año' : 'Year'}: ${eventContext.eventYear}
- ${isES ? 'Fecha de inicio' : 'Start date'}: ${formatDate(eventContext.startDate)}
- ${isES ? 'Fecha de fin' : 'End date'}: ${formatDate(eventContext.endDate)}`
        : `${copy.eventContextPrompt}: ${copy.eventNotConfigured}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${copy.executivePrompt}

${copy.headingsPrompt}

${eventBlock}

${copy.leadsPrompt} (${leadsForReport.length}):

${JSON.stringify(
                  leadsForReport.map((l) => ({
                    date: new Date(l.timestamp).toLocaleDateString(),
                    name: l.name,
                    company: l.company,
                    role: l.role,
                    email: l.email,
                    phone: l.phone,
                    country: l.country,
                    type: l.contact_type,
                    interest: l.interest,
                    opportunity: l.opportunity_level,
                    action: l.next_action,
                    notes: l.notes
                  })),
                  null,
                  2
                )}`
              }
            ]
          }
        ]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textOutput) {
        setReportResult(textOutput);
      } else {
        throw new Error(copy.aiNoOutput);
      }
    } catch (err) {
      console.error(err);
      setReportError(err.message || copy.aiFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyReport = () => {
    if (reportResult) {
      navigator.clipboard.writeText(reportResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOppColor = (lvl) => {
    if (lvl === 'high') return 'text-white border-white/40 bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.4)]';
    if (lvl === 'medium') return 'text-white/90 border-white/20 bg-white/10';
    return 'text-white/60 border-white/10 bg-transparent';
  };

  const formatMarkdown = (text) => {
    if (!text) return null;
    return text
      .replace(/## (.*)/g, '<h3 class="text-[var(--snap-blue-deep)] font-bold text-lg mt-5 mb-2">$1</h3>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>');
  };

  return (
    <div className="animation-fade pb-6">
      <div className="flex flex-col gap-3 mb-6">
        <h2 className="text-xl px-2 text-[var(--snap-blue-deep)] font-semibold">{t('db_title')}</h2>

        <div
          className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          style={{ marginBottom: '2px' }}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            {copy.activeEvent}
          </div>
          <div className="text-sm font-medium text-gray-700">{getEventSummaryText()}</div>
        </div>

        <div className="flex gap-2">
          <button
            className="btn btn-secondary flex-1 text-sm py-2 px-2 gap-1 justify-center shadow-sm"
            onClick={exportCSV}
            disabled={leads.length === 0}
          >
            <DownloadCloud size={14} /> {t('export_csv')}
          </button>

          <button
            className="btn flex-1 text-sm py-2 px-2 gap-1 justify-center bg-[var(--snap-blue-sec)] text-white shadow-md border-none hover:bg-[var(--snap-blue-deep)] transition-colors"
            onClick={generateDailyReport}
            disabled={leads.length === 0}
          >
            <Sparkles size={14} /> {t('ai_report')}
          </button>
        </div>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-lg p-3 mb-6 flex items-center gap-2 shadow-sm">
        <Search size={18} className="text-gray-400 ml-1" />
        <input
          type="text"
          placeholder={t('search_desc')}
          className="bg-transparent border-none text-[var(--text-main)] w-full p-1 outline-none font-medium placeholder:text-gray-400 placeholder:font-normal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        {filteredLeads.length === 0 ? (
          <div className="text-center text-muted p-8 glass-panel border-dashed border-gray-300">
            <p>{t('no_contacts')}</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="lead-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg drop-shadow-sm">{lead.name || 'Unknown User'}</h3>
                  <div className="text-white/80 text-sm font-medium flex items-center gap-1 mt-0.5">
                    <Building2 size={12} className="text-white/60" />
                    {lead.company} {lead.role ? `(${lead.role})` : ''}
                  </div>
                </div>
                <span
                  className={`text-[0.65rem] font-bold px-2 py-1 rounded-sm uppercase tracking-wider border ${getOppColor(
                    lead.opportunity_level
                  )}`}
                >
                  {t('opt_' + lead.opportunity_level) || lead.opportunity_level}
                </span>
              </div>

              <div className="border-t border-white/20 pt-3 mt-1 grid grid-cols-2 gap-y-2 text-xs text-white/90">
                {lead.country && (
                  <div className="flex items-center gap-1 font-semibold">
                    <MapPin size={12} className="text-[var(--accent-gold)]" /> {lead.country}
                  </div>
                )}
                <div>
                  <span className="text-white/50 mr-1">T:</span>{' '}
                  <span className="capitalize">{t('opt_' + lead.contact_type) || lead.contact_type}</span>
                </div>
                <div>
                  <span className="text-white/50 mr-1">Int:</span>{' '}
                  <span className="capitalize">{t('opt_' + lead.interest) || lead.interest}</span>
                </div>
                <div>
                  <span className="text-white/50 mr-1">Act:</span>{' '}
                  <span className="capitalize">{t('opt_' + lead.next_action) || lead.next_action}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 border-t border-white/20 pt-2">
                <div className="text-[0.65rem] text-white/60 flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(lead.timestamp).toLocaleDateString()}
                </div>
                {(lead.email || lead.phone) && (
                  <div className="text-[0.65rem] text-white font-medium">
                    {lead.email && <span className="mr-2">{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {leads.length > 0 && (
        <div className="mt-8 text-center pb-8 border-t border-gray-200 pt-4">
          <button
            className="text-red-500/80 hover:text-red-600 text-sm font-semibold flex items-center gap-1 mx-auto transition-colors"
            onClick={clearAll}
          >
            <Trash2 size={16} /> {copy.clearLeadsOnly}
          </button>
        </div>
      )}

      {showReport && (
        <div
          className="animation-fade"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
            margin: 'auto'
          }}
        >
          <div
            className="glass-panel w-full flex flex-col relative shadow-2xl border-0"
            style={{
              maxWidth: '600px',
              height: '85vh',
              maxHeight: '800px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200"
              style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1rem' }}
            >
              <div>
                <h2
                  className="text-xl flex items-center gap-2 m-0 p-0 text-[var(--snap-blue-deep)]"
                  style={{ margin: 0 }}
                >
                  <Sparkles size={20} style={{ color: 'var(--snap-blue-sec)' }} />
                  {copy.reportTypeLabel}
                </h2>
                <div className="text-xs text-gray-500 mt-1">
                  {copy.reportGeneratedFor}: {getEventSummaryText()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {copy.leadsInAnalysis}: {getLeadsForReport().length}
                </div>
              </div>

              <button
                onClick={() => setShowReport(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-1 hide-scrollbar"
              style={{ paddingBottom: '2rem', overflowY: 'auto', flex: 1 }}
            >
              {isGenerating ? (
                <div
                  className="flex flex-col items-center justify-center h-full text-center gap-4 text-muted"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[var(--snap-blue-sec)] animate-spin"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: '4px solid #E5E7EB',
                      borderTopColor: 'var(--snap-blue-sec)',
                      animation: 'spin 1s linear infinite'
                    }}
                  ></div>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `@keyframes spin { 100% { transform: rotate(360deg); } }`
                    }}
                  />
                  <p className="font-medium text-gray-500">{t('analyzing_data')}</p>
                  {!hasActiveEvent && <p className="text-xs text-gray-400">{copy.noEventContext}</p>}
                </div>
              ) : reportError ? (
                <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200 text-center font-medium">
                  {reportError}
                </div>
              ) : (
                <div
                  className="text-gray-700 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(reportResult) }}
                ></div>
              )}
            </div>

            {!isGenerating && !reportError && reportResult && (
              <div className="pt-4 border-t border-gray-200 mt-auto">
                <button
                  className="btn w-full justify-center gap-2 font-semibold shadow-md transform transition-all active:scale-95"
                  style={{ background: 'var(--snap-blue-sec)', color: 'white', padding: '1rem' }}
                  onClick={copyReport}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? t('copied') : t('copy_report')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `
        }}
      />
    </div>
  );
};

export default Reports;
