# Taste
- Communicates in casual, informal Indonesian (Bahasa gaul, using "gue/gua", slang like "gitu loh", "gas") and expects responses in the same relaxed register. Confidence: 0.8
- Prefers the assistant to execute tasks directly ("langsung eksekusi aja") with sensible assumptions instead of pausing to ask questions or confirm a plan. Confidence: 0.7
- Prefers React + Vite (SPA) over Next.js for frontends; freely switches stacks when requirements change (e.g., from Next.js to React Vite) and expects the assistant to migrate cleanly rather than argue. Confidence: 0.7
- Keeps project specifications in an `agents.md` file in the repo and expects the assistant to read it before assuming scope/requirements. Confidence: 0.7
- Prefers plain local PostgreSQL over Docker for the database; avoids Docker unless necessary. Confidence: 0.8
- Wants the spec/plan doc (agents.md) revised first before implementing when requirements or scope change. Confidence: 0.6
- Points to existing personal projects as reference implementations and expects the assistant to reuse/align with those established patterns (e.g., `SMG-EMPmvp` for auth) rather than designing a fresh approach. Confidence: 0.7
- For authentication, prefers session-based SSO against an internal portal (express-session + PostgreSQL store, as in `SMG-EMPmvp`) over JWT/OIDC. Confidence: 0.6
