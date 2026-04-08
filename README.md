# Knowledge Engine v4.0 — Impact

Sistema de Gestão do Conhecimento baseado na metodologia IMPACT.

## Deploy no Vercel via GitHub

### 1. Configurar o repositório

```bash
git init
git add .
git commit -m "feat: Knowledge Engine v4.0"
git remote add origin https://github.com/SEU_USUARIO/knowledge-engine.git
git push -u origin main
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**
2. Importe o repositório do GitHub
3. Em **Framework Preset**, selecione **Vite**
4. Em **Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `GEMINI_API_KEY` | `sk-ant-...` (sua chave da Anthropic) |

5. Clique em **Deploy**

### 3. Desenvolvimento local

```bash
npm install
```

Crie um arquivo `.env.local`:
```
GEMINI_API_KEY=AIza-sua-chave-aqui
```

```bash
npm run dev
```

Acesse `http://localhost:5173`

> Para testar a API localmente com a rota `/api/analyze`, instale o Vercel CLI:
> ```bash
> npm i -g vercel
> vercel dev
> ```

## Estrutura do Projeto

```
knowledge-engine/
├── api/
│   └── analyze.js      # Serverless function (chama Anthropic)
├── src/
│   ├── App.jsx         # Interface principal
│   ├── main.jsx        # Entry point React
│   └── index.css       # Design system Impact (gold/black)
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## Modos de Processamento

| Modo | Etapas |
|---|---|
| **Rápido** | Destilar → Conectar → Sintetizar → Agir |
| **Completo** | + Estressar (Crítica Analítica) |
| **Arquivo** | + Converter em Nota Permanente (Zettelkasten) |
