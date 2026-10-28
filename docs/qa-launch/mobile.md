# Mobile first-time user — baseline

- Date: 2026-10-28. Production build baseline 307ff40.
- Real browser: Chrome, responsive viewport 375 × 812. This is desktop Chrome responsive testing, not a physical phone or mobile keyboard.
- Network: local server at port 61733 shapes responses to 50,000 bytes/second aggregate, with 2 seconds request latency. Approximate slow 3G, not Chrome's built-in network emulation. Browser cache was cold for initial origins.
- Landing: http://127.0.0.1:61733/clinicas/. The landing opened before applying viewport; all subsequent landing review and first CTA were at 375px.
- Reproduction origin: http://localhost:61733/clinicas/ uses the same throttled server/build, separate origin cache. It was opened to capture the blank-load evidence. New-tab viewport defaulted to desktop for that reproduction screenshot; this limitation is preserved below.

## First success

Reached: **Cita añadida a la agenda** after landing → Probar la demo → Nueva cita → Milo / 29 October 2026 / default 16:00 / reason “Revisión de ejemplo desde móvil” → Crear cita. The actual form completion and success were at 375 × 812. Patient selector, calendar field, reason and submit all worked. Width measurement: window 375, document 375; no horizontal overflow.

Evidence: [mobile-before-success.png](mobile-before-success.png). Screenshot includes the success toast. [mobile-before-loaded.png](mobile-before-loaded.png) shows the loaded 375px dashboard.

## Findings

### MOBILE-LOAD — P2: blank first load offers no feedback

- Repro: On the cold throttled landing at 375px, click the header **Probar la demo**.
- Expected: Visible loading state explaining that the demo is opening, with useful recovery if loading fails.
- Actual: Navigates to the app document titled “CercaVet · Espacio de trabajo” and displays only an off-white empty viewport. AX snapshot contains only the root web area. No progress, loading label, retry or back link. The app eventually loads successfully.
- Confusion: “Did my tap work? Is this page broken?” This is an annoyance and abandonment risk, not a permanent blocker.
- Observed twice: initial 375px run and independent cold hostname. The tool call encompassing click/state/screenshot lasted ~9.8s in the first observation; this is NOT a precise load-duration metric.
- Screenshot: [mobile-before-loading.png](mobile-before-loading.png). **Evidence limitation:** the saved cold-hostname reproduction screenshot is desktop width because a newly created tab reset the viewport. The original blank state was observed and screenshot-emitted at 375px but was not saved before React mounted. Do not claim that the saved PNG itself proves 375px.
- Proposed correction: lightweight static loading content in initial HTML, replaced when the application mounts, with clear load-failure recovery.

No additional functional blockers or responsive layout errors were observed before first success. No source inspection or product-code edits were performed. Temporary viewport was reset at end.

## Rerun after fixes — passed

- Final production build supplied by coordinator: asset `CkXFv137`, 2026-10-28.
- Fresh origin: http://127.0.0.1:61833/clinicas/. Same server profile: 50,000 bytes/s aggregate and 2s request latency, approximate slow3G.
- Created a new tab, then explicitly set **375 × 812 before pressing Probar la demo**. All entry, form and success captures in this rerun are at375px.
- **MOBILE-LOAD resolved:** During cold app loading, the screen now visibly says “Estamos preparando tu clínica”, explains slow connections and example data, and offers “Volver a la presentación”. AX contains the same content. [mobile-after-loading.png](mobile-after-loading.png) captures this actual intermediate loading state at375px.
- App loaded successfully. Repeated landing → Probar la demo → Nueva cita → Milo /2026-10-29 /16:00 /“Revisión de ejemplo desde móvil” → Crear cita. Verified **Cita añadida a la agenda**; [mobile-after-success.png](mobile-after-success.png).
- DOM width check after success: viewport375px, document375px; no horizontal overflow. Form remained usable and within screen width.
- Retry fallback was not observed because the app loaded before it was needed; no claim of runtime verification for delayed retry/error state.
- No new first-success blocker found. Viewport reset after completion. Physical-device touch/keyboard behavior remains outside this responsive Chrome run.
