export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
}

const MODEL = 'claude-sonnet-4-6'
const URL_REGEX = /^https?:\/\//i

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada nas variáveis de ambiente.' })
  }

  // Vercel Node.js runtime auto-parses JSON body
  const { systemPrompt, userMessage } = req.body || {}

  if (!systemPrompt || !userMessage) {
    return res.status(400).json({ error: 'Campos systemPrompt e userMessage são obrigatórios' })
  }

  // Block URLs before calling the model
  const contentLine = userMessage.split('\n').find(l => l.includes('Conteúdo Base:'))
  const contentValue = contentLine?.split('Conteúdo Base:')[1]?.trim() || ''
  if (URL_REGEX.test(contentValue)) {
    return res.status(422).json({
      error: 'URLs externas não são suportadas. Cole o texto diretamente no campo de entrada.',
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    let data
    const text = await response.text()
    try {
      data = JSON.parse(text)
    } catch {
      return res.status(500).json({ error: `Resposta inválida da API: ${text.slice(0, 200)}` })
    }

    if (!response.ok) {
      const msg = data.error?.message || 'Erro na API Anthropic'
      return res.status(response.status).json({ error: msg })
    }

    const content = data.content?.[0]?.text
    if (!content) {
      return res.status(500).json({ error: 'Resposta vazia do modelo.' })
    }

    return res.status(200).json({ content })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
