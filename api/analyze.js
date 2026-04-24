export const config = { runtime: 'edge' }

const MODEL = 'claude-sonnet-4-6'
const TIMEOUT_MS = 20000

const URL_REGEX = /^https?:\/\//i

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada nas variáveis de ambiente.' }), { status: 500 })
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

  // Block URLs before calling the model
  const contentLine = userMessage.split('\n').find(l => l.includes('Conteúdo Base:'))
  const contentValue = contentLine?.split('Conteúdo Base:')[1]?.trim() || ''
  if (URL_REGEX.test(contentValue)) {
    return new Response(JSON.stringify({
      error: 'URLs externas não são suportadas. Cole o texto diretamente no campo de entrada.',
    }), { status: 422 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (!response.ok) {
      const msg = data.error?.message || 'Erro na API Anthropic'
      return new Response(JSON.stringify({ error: msg }), { status: response.status })
    }

    const content = data.content?.[0]?.text
    if (!content) {
      return new Response(JSON.stringify({ error: 'Resposta vazia do modelo.' }), { status: 500 })
    }

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({
        error: 'Tempo limite excedido (20s). Tente novamente ou reduza o volume do conteúdo.',
      }), { status: 504 })
    }
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), { status: 500 })
  }
}
