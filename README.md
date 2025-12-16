# GuardianScreen - Professional Background Check Dashboard

[![Deploy to Cloudflare]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/guardianscreen-professional-background-check-dashboard))]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/guardianscreen-professional-background-check-dashboard))

A professional, compliance-focused background check management platform featuring secure search execution, credit monitoring, and immutable audit logging. GuardianScreen provides an enterprise-grade dashboard for compliance officers and HR managers to conduct, manage, and audit criminal background checks with a stunning, responsive UI powered by Cloudflare Workers and Durable Objects.

## ✨ Key Features

- **Mission Control Dashboard**: High-level metrics (Credits Remaining, Recent Hits, Compliance Score), quick-search widget, and sparkline charts for search volume.
- **Investigation Center**: Complex form for single/batch searches with Zod validation, real-time feedback, and simulated API integration.
- **Case Files (History)**: Paginated, filterable table of past searches with status badges (Clear/Hit/Anonymized).
- **Audit & Compliance Log**: Immutable ledger of API interactions, credit deductions, and errors.
- **Settings Vault**: Secure API key management, credit thresholds, and data retention configuration.
- **Visual Excellence**: Modern SaaS layout with dark mode, smooth animations, responsive design, and shadcn/ui components.
- **Edge-Powered**: Cloudflare Workers backend with Durable Objects for stateful persistence (CheckEntity, SettingsEntity).
- **Compliance-Ready**: Credit monitoring, audit logging, data anonymization simulation, and error handling.

## 🛠 Tech Stack

- **Frontend**: React 18, React Router, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Lucide React, Zod, React Hook Form, TanStack Query, Sonner, Zustand
- **Backend**: Hono, Cloudflare Workers, Durable Objects (GlobalDurableObject via core-utils library)
- **Data & Utils**: Date-fns, Immer, UUID
- **Dev Tools**: Bun, TypeScript, ESLint, Wrangler
- **Deployment**: Cloudflare Workers/Pages

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.0+ (package manager)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (for deployment)
- Cloudflare account (free tier works)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd guardianscreen
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Generate TypeScript types from Wrangler:
   ```bash
   bun run cf-typegen
   ```

### Development

- Start the dev server (proxies API to Workers):
  ```bash
  bun run dev
  ```
  Open [http://localhost:3000](http://localhost:3000)

- Lint code:
  ```bash
  bun run lint
  ```

### Build & Preview

- Build for production:
  ```bash
  bun run build
  ```

- Preview production build:
  ```bash
  bun run preview
  ```

## 📖 Usage

The app features a fixed left sidebar navigation with five main views:

1. **Mission Control** (`/`): Dashboard with metrics and quick search.
2. **Investigation Center** (`/investigate`): Run background checks via form.
3. **Case Files** (`/cases`): View search history.
4. **Audit Log** (`/audit`): Compliance ledger.
5. **Settings** (`/settings`): Manage API keys and config.

### API Endpoints

All API routes are under `/api/` and use `ApiResponse<T>` format:

- `POST /api/checks/run`: Submit background check (simulates external API).
- `GET /api/checks`: Paginated history (`?cursor=&limit=10`).
- `POST /api/settings`: Update vault config.
- `GET /api/audit`: Fetch logs.

Frontend uses `api-client.ts` for typed fetches. Backend logic in `worker/user-routes.ts` leverages `CheckEntity` and `SettingsEntity`.

### Customizing

- **UI**: Edit `src/pages/*.tsx`, use shadcn/ui components.
- **Backend**: Extend `worker/entities.ts` (e.g., `CheckEntity`), add routes in `worker/user-routes.ts`.
- **Sidebar**: Customize `src/components/app-sidebar.tsx`.
- **Theme**: Toggle via `ThemeToggle`; supports light/dark modes.

**Do not modify**: `wrangler.jsonc`, `worker/core-utils.ts`, `worker/index.ts`, shadcn/ui components.

## ☁️ Deployment

Deploy to Cloudflare Workers/Pages with one command:

```bash
bun run deploy
```

This builds the frontend, bundles the Worker, and deploys everything.

[![Deploy to Cloudflare]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/guardianscreen-professional-background-check-dashboard))]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/guardianscreen-professional-background-check-dashboard))

**Post-Deploy**:
- Visit your `*.workers.dev` URL.
- Data persists via Durable Objects (no external DB needed).
- Enable analytics/observability in Cloudflare dashboard.

## 🏗 Architecture Overview

- **Frontend**: Vite + React Router → Static assets served by Pages.
- **Backend**: Hono Worker → Durable Objects for entities (checks, settings).
- **Storage**: Single `GlobalDurableObject` with indexed entities (atomic ops, pagination).
- **Data Flow**: Form → Worker API → DO persistence → JSON response.

See `shared/types.ts` for shared types.

## 🤝 Contributing

1. Fork & clone.
2. Install deps: `bun install`.
3. Create branch: `git checkout -b feature/xyz`.
4. Commit: `git commit -m "feat: add xyz"`.
5. Push & PR.

Lint before pushing: `bun run lint`.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.