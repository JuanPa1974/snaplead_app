/* global process */

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const getServerApiKey = () => process.env.GEMINI_API_KEY;

const parseJsonBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
};

const cleanExtractedData = (data) => ({
  name: typeof data.name === 'string' ? data.name : '',
  company: typeof data.company === 'string' ? data.company : '',
  role: typeof data.role === 'string' ? data.role : '',
  email: typeof data.email === 'string' ? data.email : '',
  phone: typeof data.phone === 'string' ? data.phone : '',
  country: typeof data.country === 'string' ? data.country : ''
});

const extractJsonObject = (textOutput) => {
  const start = textOutput.indexOf('{');
  const end = textOutput.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('La IA no devolvió un JSON válido.');
  }

  return JSON.parse(textOutput.slice(start, end + 1));
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método no permitido.' });
  }

  const apiKey = getServerApiKey();
  if (!apiKey) {
    return jsonResponse(503, {
      error: 'La IA no está configurada en el servidor. Contacta al administrador.'
    });
  }

  const body = parseJsonBody(event);
  const image = body?.image;

  if (!image || typeof image !== 'string') {
    return jsonResponse(400, { error: 'No se recibió una imagen válida para procesar.' });
  }

  const base64Data = image.includes(',') ? image.split(',')[1] : image;

  if (!base64Data) {
    return jsonResponse(400, { error: 'La imagen enviada no contiene datos válidos.' });
  }

  try {
    const payload = {
      contents: [{
        parts: [
          { text: 'Extract the following details from this business card: name, company, role, email, phone, country. Return ONLY a valid JSON object.' },
          { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
        ]
      }]
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
      return jsonResponse(502, { error: 'No se pudo procesar la imagen con IA.' });
    }

    const result = await response.json();
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return jsonResponse(502, { error: 'La IA no devolvió datos de contacto.' });
    }

    const extractedJson = extractJsonObject(textOutput);

    return jsonResponse(200, { data: cleanExtractedData(extractedJson) });
  } catch {
    return jsonResponse(500, { error: 'Error al extraer datos de la tarjeta.' });
  }
};
