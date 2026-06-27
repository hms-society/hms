<h1 align="center">⚖️ HMS</h1>

A **legal practice management** platform covering the full journey of a case — from first contact to closure. HMS organizes intake, cases, production and execution of legal pieces, documents, communication, and billing into well-bounded modules, supported by **AI**, **electronic signature**, and **WhatsApp** integration.

## 🚀 Overview

HMS gives law firms and legal teams a single, auditable, and secure workflow, offering:

-   **Modular Domain:** Modules with clear responsibilities (Engagement, Case Management, Legal Production, Legal Execution, Document Management, Communication, Portal, Identity, Billing, Audit) that communicate through events.
-   **Assisted AI:** Assisted drafting, document classification, and triage via Mastra AI + DeepSeek — always with human validation before anything takes effect.
-   **Compliance:** Immutable consent log (LGPD) and an audit trail with hash chaining.
-   **Complete Environment:** Web platform, API (Server), and shared domain (Core), with local infrastructure via Docker.

## 🛠 Tech Stack

The project is a **monorepo** managed by **Turborepo**, using the modern TypeScript ecosystem:

-   **Management:** [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/) 5.9
-   **Frontend (Web):** [TanStack Start](https://tanstack.com/start) + [React](https://react.dev/) 19
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4 + [shadcn/ui](https://ui.shadcn.com/)
-   **Data & Navigation:** [TanStack Query](https://tanstack.com/query) + [TanStack Router](https://tanstack.com/router)
-   **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
-   **Backend (Server):** [NestJS](https://nestjs.com/)
-   **Database:** [Supabase](https://supabase.com/) (PostgreSQL) + [Drizzle ORM](https://orm.drizzle.team/)
-   **Auth & Storage:** [Supabase Auth](https://supabase.com/docs/guides/auth) + Supabase Storage
-   **Jobs/Workflows:** [Inngest](https://www.inngest.com/)
-   **AI:** [Mastra AI](https://mastra.ai/) + DeepSeek V4
-   **WhatsApp:** [Evolution API](https://doc.evolution-api.com/) v2
-   **Electronic Signature:** [DocuSeal](https://www.docuseal.com/) (self-hosted)
-   **Quality:** [Biome](https://biomejs.dev/) + [Vitest](https://vitest.dev/)

## 🏗 Architecture

HMS follows a **domain-driven modular** model (DDD) with **event-based communication** between modules.

-   **Agnostic Core:** The `@hms/core` package holds domain entities, events, and business rules, independent of frameworks.
-   **Strict Boundaries:** Each module owns its responsibilities — no module reaches into another's scope; integration happens through events and shared references.
-   **Adapters:** The applications (`web`, `server`) act as adapters that consume the system core.

For details, see the [Infrastructure](documentation/infrastructure.md) and [Module Responsibilities](documentation/modules.md).

## 📂 Project Structure

```bash
hms/
├── apps/                  # Runnable applications
│   ├── web/               # Frontend (TanStack Start + React)
│   └── server/            # Backend API (NestJS)
├── packages/              # Shared libraries
│   └── core/              # Business rules and domain (DDD)
├── documentation/         # Centralized documentation
├── volumes/               # Local service configs (Supabase, Kong, Auth)
└── docker-compose.yaml    # Local infrastructure
```

## ⚙️ Setup and Installation

### Prerequisites
-   Node.js 18 or higher.
-   pnpm 9 (recommended via `corepack enable`).
-   Docker + Docker Compose (for the local infrastructure).

### Step by Step

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/hms-society/hms.git
    cd hms
    ```

2.  **Configure the environment:**
    Create the `.env` files from the examples (`.env.example`) at the root and in the apps that need them. Ask the team for the Supabase and other service credentials.

3.  **Install dependencies:**
    ```bash
    pnpm install
    ```

4.  **Start the local infrastructure:**
    ```bash
    docker compose up -d
    ```
    Brings up local Supabase (Auth, PostgreSQL, Storage, Kong) and Mailpit.

5.  **Run the project (development mode):**
    ```bash
    pnpm dev
    ```
    Starts all monorepo applications simultaneously via Turborepo.

## 📖 Documentation

The full documentation lives in the `documentation/` directory. Start here:

-   [Infrastructure and Technical Decisions](documentation/infrastructure.md)
-   [Module Responsibilities](documentation/modules.md)
-   [Design System](documentation/design.md)
-   [Tooling](documentation/tooling.md)
-   Rules and Conventions
    -   [Commit Conventions](documentation/rules/commit-rules.md)
-   Prompts
    -   [Pull Request Creation](documentation/prompts/create-pr-prompt.md)

Guidance for AI agents: see [AGENTS.md](AGENTS.md).

## 🧪 Tests

The project uses `Vitest` for automated tests, from the domain in core to the UI.

```bash
# Frontend tests
pnpm --filter web test

# Backend tests
pnpm --filter server test
```

## ✅ Quality

```bash
pnpm check          # lint + format (Biome) with safe fixes
pnpm check-types    # type-check across the whole monorepo
```

Commits follow the **Conventional Commits** standard, validated by commitlint + husky. See the [Commit Conventions](documentation/rules/commit-rules.md).

## 📝 License

Private and proprietary project (`UNLICENSED`). All rights reserved to hms-society.

---

<p align="center">
  Made with 💜 by <a href="https://github.com/JohnPetros">John Petros</a> 👋🏻
</p>
