import remarkGfm from 'remark-gfm'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const MODES = ['Rápido', 'Completo', 'Arquivo']

const SYSTEM_PROMPT = `Você é um especialista em Gestão do Conhecimento e Operações, operando sob princípios de engenharia da informação: captura de precisão, destilação e aplicação prática. Seu objetivo é processar informações brutas e transformá-las em ativos intelectuais acionáveis, precisos e livres de ruído.

INSTRUÇÕES DE EXECUÇÃO — execute rigorosamente as etapas abaixo conforme o Modo selecionado. Use formatação em Markdown com títulos claros.

**1. DESTILAR (Lego Bricks)**
Isole o ruído. Extraia de 3 a 5 ideias centrais — os blocos fundamentais que sustentam o argumento do texto. Numere cada bloco. Vá direto ao ponto.

**2. CONECTAR (Matriz de Impacto)**
Para CADA Lego Brick extraído na etapa 1, defina de forma ultra-concisa os três vetores abaixo:
- Aplicação: Como isso se integra aos pilares da metodologia IMPACT declarada nos dados de entrada?
- Decisão: Qual o impacto real na tomada de decisão ou na precisão de projetos complexos?
- Risco: Qual o risco invisível ou custo concreto de aplicar essa ideia de forma incorreta ou incompleta?
- Se não houver evidência suficiente no texto para preencher um vetor, escreva: [sem base no input]. Não infira.

**3. SINTETIZAR (Resumo Progressivo)**
- Nível 1 — Essência: A tese central do autor em exatas 3 frases afiadas. Sem introdução, sem contextualização histórica.
- Nível 2 — Mecânica: Um parágrafo denso e bem estruturado detalhando como a ideia funciona na prática.

**4. ESTRESSAR (Crítica Analítica)** — Execute APENAS se Modo = Completo ou Arquivo
Atue como advogado do diabo. Identifique os pontos cegos, premissas não testadas, limitações práticas e o que falta para a ideia funcionar em contextos de alta complexidade ou alto risco.

**5. AGIR (Next Actions Filtradas)**
Defina 3 próximos passos hiper-práticos e isolados que podem ser iniciados hoje mesmo.
REGRA DE OURO: Essas ações DEVEM ser estritamente direcionadas para resolver o Objetivo da Análise declarado nos dados de entrada. Descarte o que não serve ao objetivo. Comece cada passo com um verbo de ação no imperativo.

**6. CONVERTER EM NOTA PERMANENTE (Knowledge Asset)** — Execute APENAS se Modo = Arquivo
Transforme o insight de maior valor desta análise em uma Nota Permanente reutilizável:
- Título: [Nome curto, memorável e específico do conceito]
- Ideia Central: 2 a 3 frases claras como se ensinasse para o "você do futuro".
- Princípio Chave: Uma única frase que capture a regra geral aplicável a outros contextos.
- Aplicação Prática: 2 a 3 linhas sobre quando este conceito deve ser ativado.
- Conexões Genuínas: 2 conexões reais com outros conceitos — Conexões apenas com conceitos citados ou claramente pressupostos pelo autor. Se não houver, omita.
- Tags: 3 a 5 tags conceituais curtas.

RESTRIÇÕES DE TOM E ESTILO:
- Adote a linguagem de um diretor de operações em uma reunião executiva: didático, cirúrgico, focado em resultados.
- Proibido: iniciar com contexto histórico genérico, conclusões que repetem o que foi dito, transições excessivamente explicativas.
- Entregue a informação pura.`

const buildUserMessage = ({ objective, impactMethod, mode, content }) => `
**DADOS DE ENTRADA:**
- Objetivo da Análise: ${objective}
- Metodologia IMPACT: ${impactMethod}
- Modo de Processamento: ${mode}
- Conteúdo Base: ${content}

Execute a análise KNOWLEDGE ENGINE v4.0 agora.
`

const isURL = (text) => /^https?:\/\//i.test(text.trim())

const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
)
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
)
const IconWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const Label = ({ children }) => (
  <p style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
    {children}
  </p>
)

const inputStyle = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
  fontSize: '0.8rem', fontWeight: 300, padding: '0.6rem 0.75rem', outline: 'none',
  transition: 'border-color 0.2s',
}

export default function App() {
  const [objective,    setObjective]    = useState('Extrair ideias centrais e aplicações práticas')
  const [impactMethod, setImpactMethod] = useState('IMPACT = Identificar, Mapear, Priorizar, Agir, Controlar, Transferir')
  const [mode,         setMode]         = useState('Completo')
  const [content,      setContent]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)
  const [copied,       setCopied]       = useState(false)

  const urlDetected = isURL(content)
  const canRun = content.trim().length > 0 && !loading && !urlDetected

  const run = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          userMessage: buildUserMessage({ objective, impactMethod, mode, content }),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na API')
      setResult(data.content)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(result || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, fontStyle: 'italic', color: 'var(--gold-500)', letterSpacing: '0.02em' }}>
            Knowledge Engine
          </h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold-700)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            v4.0 · Impact
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-500)', display: 'inline-block' }} className="pulse" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Sistema Online
          </span>
        </div>
      </header>

      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--gold-500) 40%, transparent)', opacity: 0.3 }} />

      {/* Body */}
      <div className="app-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Sidebar */}
        <aside className="app-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold-500)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.25rem' }}>
              ◆ Configuração
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <Label>Objetivo da Análise</Label>
              <input style={inputStyle} value={objective} onChange={e => setObjective(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--gold-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <Label>Metodologia IMPACT</Label>
              <textarea style={{ ...inputStyle, height: 80, resize: 'none', lineHeight: 1.5 }}
                value={impactMethod} onChange={e => setImpactMethod(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--gold-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <Label>Modo de Processamento</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {MODES.map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ padding: '0.5rem 0', fontSize: '0.65rem', fontWeight: 500, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid', borderColor: mode === m ? 'var(--gold-500)' : 'var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s', background: mode === m ? 'var(--gold-500)' : 'transparent', color: mode === m ? 'var(--black)' : 'var(--text-muted)' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.875rem 1rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {mode === 'Rápido'   && '→ Etapas 1, 2, 3, 5. Análise objetiva sem crítica.'}
              {mode === 'Completo' && '→ Etapas 1–5. Inclui stress-test e crítica analítica.'}
              {mode === 'Arquivo'  && '→ Etapas 1–6. Gera Nota Permanente estilo Zettelkasten.'}
            </p>
          </div>

          <button onClick={run} disabled={!canRun} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.9rem', borderRadius: 'var(--radius)', border: '1px solid', borderColor: canRun ? 'var(--gold-500)' : 'var(--border)', background: canRun ? 'var(--gold-500)' : 'transparent', color: canRun ? 'var(--black)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: canRun ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {loading ? <><IconSpinner /> Processando...</> : <><IconZap /> Iniciar Destilação</>}
          </button>
        </aside>

        {/* Main */}
        <main className="app-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Input */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Entrada Bruta
              </span>
              {content && (
                <button onClick={() => { setContent(''); setResult(null); setError(null) }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                  Limpar
                </button>
              )}
            </div>
            <textarea
              style={{ ...inputStyle, height: 140, resize: 'vertical', border: 'none', borderRadius: 0, padding: '1.25rem', lineHeight: 1.65, background: 'transparent', fontSize: '0.85rem' }}
              placeholder="Cole o texto, artigo ou transcrição aqui. Não cole links — o conteúdo externo é bloqueado pela maioria dos sites."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          {/* YouTube warning */}
          {urlDetected && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(201,168,76,0.06)', border: '1px solid var(--gold-900)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
              <span style={{ color: 'var(--gold-500)', marginTop: '0.05rem', flexShrink: 0 }}><IconWarn /></span>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--gold-500)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  URL externa detectada
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  O modelo não acessa conteúdo externo via link — a maioria dos sites bloqueia esse acesso. Cole o texto diretamente no campo. Para vídeos do YouTube, extraia a transcrição em <a href="https://notegpt.io/youtube-transcript" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-500)' }}>notegpt.io</a>.
                </p>
              </div>
            </div>
          )}

          {/* API Error */}
          {error && (
            <div style={{ background: 'rgba(180,40,40,0.08)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#e07070', marginBottom: 4 }}>Erro de Processamento</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="fade-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold-500)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  ◆ Ativo Intelectual — Modo {mode}
                </span>
                <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.35rem 0.75rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: copied ? 'var(--gold-500)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {copied ? <><IconCheck /> Copiado</> : <><IconCopy /> Copiar</>}
                </button>
              </div>
              <div className="prose" style={{ padding: '2rem 2.5rem', maxWidth: 760 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && !urlDetected && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--border-strong)', marginBottom: '0.5rem' }}>
                Aguardando Destilação
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Cole o conteúdo e configure o modo
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Knowledge Engine v4.0 · Metodologia Impact · Powered by Gemini 3.1 Flash Lite
        </p>
      </footer>
    </div>
  )
}
