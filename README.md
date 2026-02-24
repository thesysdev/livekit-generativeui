# LiveKit Generative UI

A voice AI agent that renders rich, interactive UI in real time using [LiveKit](https://livekit.io) and [Thesys](https://thesys.dev). Speak to the agent and it responds with both voice and on-screen visuals — product cards, charts, comparisons, forms, and more.

## How it works

1. **Next.js frontend** connects to a LiveKit room and renders streamed UI components via the Thesys GenUI SDK.
2. **LiveKit voice agent** (Node/TypeScript) listens, thinks, and speaks using configurable STT/LLM/TTS models. It calls tools to search the web, find images, and generate visual UI streamed back to the browser.

## Setup

### Prerequisites

- Node.js 20+
- pnpm
- A [LiveKit Cloud](https://cloud.livekit.io) project (or self-hosted server)
- API keys for [Thesys](https://platform.thesys.dev), [Exa](https://exa.ai), and optionally Google Custom Search

### Install

```bash
# Frontend
pnpm install

# Agent (separate project in livekit-agent/)
cd livekit-agent && pnpm install
```

### Configure

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

### Run

Start the Next.js dev server and the agent in separate terminals:

```bash
# Terminal 1 — frontend
pnpm dev

# Terminal 2 — voice agent
cd livekit-agent && pnpm agent dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Start**.

### Deploy agent to LiveKit Cloud

```bash
cd livekit-agent
lk cloud auth
lk agent create --secrets-file=../.env
```

Subsequent deploys: `cd livekit-agent && lk agent deploy`

## License

MIT — see [LICENSE](src/app/LICENSE).
