const MODEL = 'claude-sonnet-4-6'
const URL_REGEX = /^https?:\/\//i

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }))
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).end(JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada.' }))
  }

  const { systemPrompt, userMessage } = req.body || {}

  if (!systemPrompt || !userMessage) {
    return res.status(400).end(JSON.stringify({ error: 'Campos obrigatórios ausentes.' }))
  }

  const contentLine = userMessage.split('\n').find(l => l.includes('Conteúdo Base:'))
  const contentValue = contentLine?.split('Conteúdo Base:')[1]?.trim() || ''
  if (URL_REGEX.test(contentValue)) {
    return res.status(422).end(JSON.stringify({
      error: 'URLs externas não são suportadas. Cole o texto diretamente.',
    }))
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
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

    const raw = await anthropicRes.text()

    let data
    try {
      data = JSON.parse(raw)
    } catch {
      return res.status(500).end(JSON.stringify({
        error: `API retornou resposta inválida: ${raw.slice(0, 300)}`
      }))
    }

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).end(JSON.stringify({
        error: data.error?.message || `Erro HTTP ${anthropicRes.status}`
      }))
    }

    const content = data.content?.[0]?.text
    if (!content) {
      return res.status(500).end(JSON.stringify({ error: 'Resposta vazia do modelo.' }))
    }

    return res.status(200).end(JSON.stringify({ content }))

  } catch (err) {
    return res.status(500).end(JSON.stringify({ error: err.message || 'Erro interno' }))
  }
}
