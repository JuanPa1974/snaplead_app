const SERVER_AI_NOT_CONFIGURED = 'La IA no está configurada en el servidor. Contacta al administrador.';

const postToFunction = async (endpoint, payload) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || SERVER_AI_NOT_CONFIGURED);
  }

  return result;
};

export const extractLeadData = async (image) => {
  const result = await postToFunction('/.netlify/functions/gemini-extract', { image });
  return result.data || {};
};

export const generateLeadReport = async ({ leads, eventContext, language }) => {
  const result = await postToFunction('/.netlify/functions/gemini-report', {
    leads,
    eventContext,
    language
  });
  return result.report || '';
};
