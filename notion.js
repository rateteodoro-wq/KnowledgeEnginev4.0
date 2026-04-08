export const config = { runtime: 'edge' }

const DATABASE_ID = '33ce7cdf-bf6e-8000-ace0-000be04b6485'
const NOTION_VERSION = '2022-06-28'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const token = process.env.NOTION_TOKEN
  if (!token) {
    return new Response(JSON.stringify({ error: 'NOTION_TOKEN não configurada nas variáveis de ambiente.' }), { status: 500 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 })
  }

  const { titulo, ideiaCentral, principioChave, aplicacaoPratica, conexoes, tags, fonte, autor, conteudoCompleto } = body

  if (!titulo) {
    return new Response(JSON.stringify({ error: 'Campo título é obrigatório' }), { status: 400 })
  }

  // Build page content in Notion markdown
  const pageContent = [
    `## 💡 Ideia Central`,
    ideiaCentral || '',
    `## 🔑 Princípio Chave`,
    principioChave || '',
    `## ⚙️ Aplicação Prática`,
    aplicacaoPratica || '',
    `---`,
    `*Nota gerada via Knowledge Engine v4.0*`,
  ].join('\n\n')

  // Build tags array for multi_select
  const tagsArray = (tags || []).map(t => ({ name: t.replace(/^#/, '').trim() }))
  const conexoesArray = (conexoes || []).map(c => ({ name: c.trim() }))

  const notionPayload = {
    parent: { database_id: DATABASE_ID },
    icon: { emoji: '💎' },
    properties: {
      TÍTULO: {
        title: [{ text: { content: titulo } }],
      },
      ...(fonte && {
        FONTE: { url: fonte.startsWith('http') ? fonte : null },
      }),
      ...(autor && {
        AUTOR: { rich_text: [{ text: { content: autor } }] },
      }),
      Status: {
        status: { name: '💎 PERMANENTE' },
      },
      ...(tagsArray.length > 0 && {
        TAGS: { multi_select: tagsArray },
      }),
      ...(conexoesArray.length > 0 && {
        CONEXÕES: { multi_select: conexoesArray },
      }),
    },
    children: [
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [{ type: 'text', text: { content: principioChave || titulo } }],
          icon: { emoji: '🔑' },
          color: 'yellow_background',
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '💡 Ideia Central' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: ideiaCentral || '' } }] },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '⚙️ Aplicação Prática' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: aplicacaoPratica || '' } }] },
      },
      {
        object: 'block',
        type: 'divider',
        divider: {},
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'Nota gerada via Knowledge Engine v4.0' }, annotations: { italic: true, color: 'gray' } }],
        },
      },
    ],
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify(notionPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Erro na API do Notion' }), { status: response.status })
    }

    return new Response(JSON.stringify({ url: data.url, id: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), { status: 500 })
  }
}
