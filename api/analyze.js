export const config = { runtime: 'edge' }

const MODEL = 'gemini-3.1-flash-lite-preview'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY não configurada nas variáveis de ambiente.' }), { status: 500 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 })
  }

  const { systemPrompt, userMessage } = body
  if (!systemPrompt || !userMessage) {
    return new Response(JSON.stringify({ error: 'Campos systemPrompt e userMessage são obrigatórios' }), { status: 400 })
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data.error?.message || 'Erro na API Gemini'
      return new Response(JSON.stringify({ error: msg }), { status: response.status })
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      return new Response(JSON.stringify({ error: 'Resposta vazia do modelo. Verifique se o nome do modelo está correto.' }), { status: 500 })
    }

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), { status: 500 })
  }
}
