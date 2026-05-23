/* global process */

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const parseJsonBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
};

const formatDate = (dateString, language) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return language === 'es' ? d.toLocaleDateString('es-ES') : d.toLocaleDateString('en-US');
};

const cleanLead = (lead, language) => ({
  date: formatDate(lead.timestamp, language),
  name: lead.name || '',
  company: lead.company || '',
  role: lead.role || '',
  email: lead.email || '',
  phone: lead.phone || '',
  country: lead.country || '',
  type: lead.contact_type || '',
  interest: lead.interest || '',
  opportunity: lead.opportunity_level || '',
  action: lead.next_action || '',
  notes: lead.notes || ''
});

const buildPrompt = ({ leads, eventContext, language }) => {
  const isES = language === 'es';
  const hasActiveEvent =
    eventContext?.eventName &&
    eventContext?.eventYear &&
    eventContext?.startDate &&
    eventContext?.endDate;

  const eventBlock = hasActiveEvent
    ? `${isES ? 'Evento activo' : 'Active event'}:
- ${isES ? 'Nombre del evento' : 'Event name'}: ${eventContext.eventName}
- ${isES ? 'Año' : 'Year'}: ${eventContext.eventYear}
- ${isES ? 'Fecha de inicio' : 'Start date'}: ${formatDate(eventContext.startDate, language)}
- ${isES ? 'Fecha de fin' : 'End date'}: ${formatDate(eventContext.endDate, language)}`
    : `${isES ? 'Evento activo' : 'Active event'}: ${isES ? 'Sin evento activo configurado' : 'No active event configured'}`;

  const executivePrompt = isES
    ? 'Actúa como un gerente senior de ferias y desarrollo de negocio B2B. Analiza los leads captados en este evento y genera un informe ejecutivo profesional en español.'
    : 'Act as a senior B2B trade show and business development manager. Analyze the leads captured during this event and generate a professional executive report in English.';

  const headingsPrompt = isES
    ? `Usa ESTRICTAMENTE estos 4 encabezados en Markdown:
## Resumen Ejecutivo
## Métricas Clave
## Insights Comerciales
## Próximas Acciones`
    : `Use STRICTLY these 4 headings in Markdown:
## Executive Summary
## Key Metrics
## Business Insights
## Recommended Next Actions`;

  return `${executivePrompt}

${headingsPrompt}

${eventBlock}

${isES ? 'Estos son los leads analizados' : 'These are the analyzed leads'} (${leads.length}):

${JSON.stringify(leads.map((lead) => cleanLead(lead, language)), null, 2)}`;
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método no permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, {
      error: 'La IA no está configurada en el servidor. Contacta al administrador.'
    });
  }

  const body = parseJsonBody(event);
  const leads = body?.leads;

  if (!Array.isArray(leads) || leads.length === 0) {
    return jsonResponse(400, { error: 'No se recibieron leads válidos para generar el informe.' });
  }

  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: buildPrompt({
                leads,
                eventContext: body.eventContext || {},
                language: body.language === 'en' ? 'en' : 'es'
              })
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
      return jsonResponse(502, { error: 'No se pudo generar el informe con IA.' });
    }

    const result = await response.json();
    const report = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!report) {
      return jsonResponse(502, { error: 'La IA no devolvió contenido para el informe.' });
    }

    return jsonResponse(200, { report });
  } catch {
    return jsonResponse(500, { error: 'Error al generar el informe IA.' });
  }
};
