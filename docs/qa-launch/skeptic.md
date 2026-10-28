# Skeptic — baseline

Date: 2026-10-28. Browser: real Chrome, default desktop viewport. Independent origin: http://127.0.0.1:61732/clinicas/. Build baseline: 307ff40. No real data, external messages, signup or payment.

## Journey and first success

Read landing, expanded “¿Cómo se define el precio?” and “¿Necesito registrarme o facilitar datos?”, examined the footer. The price explanation is adequate for a bespoke demo: free demonstration, custom implementation priced by scope, no commitment. No signup is required, accurately disclosed. I proceeded only with fictitious data. Entered Demo, tried the information icon, opened “Explorar la demo”, followed “Abrir agenda”, selected Nina's confirmed 11:30 appointment, started consultation, entered fictional assessment and instructions, finalized successfully. UI showed “Consulta finalizada. El seguimiento queda vinculado a esta visita.” and a linked followup action.

First meaningful success: **PASS** — consultation finalized and followup created.

Evidence: [success](skeptic-before-success.png).

## Findings

### TRUST-DISCLOSURE — P2 — missing discoverable demo privacy/use explanation

- Reproduction: landing → pricing/data FAQ → footer, before choosing Demo.
- Expected: accessible “Privacidad / Uso de la demo” explanation of what is stored locally, who can access it in a shared browser, how to clear it, and that actual clinic operation/real records are outside this demo.
- Actual: FAQ says changes stay in this browser; scope says fictitious data. Footer has only Eilvi, Identidad de marca and Demo. There is no privacy/use link or explanation of storage lifetime/removal. I cannot determine what happens to information I might type or leave on a shared computer.
- Impact: trust hesitation before trial; not a claim of statutory noncompliance, and not a request to invent contractual terms or a privacy contact.
- Suggested correction: factual demo-use/data page or section, linked from landing and app, separating local entered data from hosting request logs and identifying only verified facts. Keep demo free/no-registration language.
- Screenshots: [FAQ](skeptic-before-trust.png), [footer](skeptic-before-trust-footer.png).

### INFORMATION-NO-RESPONSE — P2 — information icon did not open information

- Reproduction: fresh demo → click button with accessible label “Información sobre la demostración”.
- Expected: visible explanation, dialog, or destination.
- Actual: after click, accessibility tree and screenshot remained on dashboard; no explanatory text appeared. The separate “Explorar la demo” card then opened the guide correctly.
- Impact: the trust-oriented escape route provides no answer. Observed once; parent should inspect implementation to distinguish a dead control from timing before including in merged confirmed counts.
- Screenshot: [unchanged dashboard](skeptic-before-info-no-response.png).

## Scope notes

No pricing defect counted: bespoke pricing and free demo are clearly disclosed after opening the FAQ. No signup defect counted: none is promised or required. Did not change viewport, clear user data, inspect source, or modify product code.

## Corrected-build rerun — 2026-10-28

Fresh isolated origin: http://127.0.0.1:61832/clinicas/. Real Chrome, default desktop viewport unchanged. Repeated original journey through first completed consultation with the same fictional assessment and instructions.

- **TRUST-DISCLOSURE: PASS / resolved.** The hero has “Demo gratuita · Sin registro · Contactos simulados” and an immediate “Privacidad y uso de la demo” link. The linked page explains persistence until site-data deletion, shared browser/profile access, lack of accounts, no form-record upload, separate hosting requests, simulation, local exports, full deletion versus reset, and demonstration-only scope. Free demo and separately scoped implementation are explicit; no invented contract or signup. “Volver a la presentación” returns correctly. Footer “Precio” goes to the pricing FAQ, which opens with the same clear no-commitment explanation.
- **Information access: PASS.** Clicking the exact “Información sobre la demostración” button now opens the guide immediately. The baseline observation is not proof of a dead handler: root found the old fixed sidebar clipped the button at the desktop viewport height. Treat it as accessibility/layout reachability rather than a confirmed missing click handler.
- **First success: PASS.** Guide → Abrir agenda → Nina 11:30 confirmed → Iniciar consulta → enter fictional assessment/instructions → Finalizar consulta. UI shows Atendida, “Consulta finalizada. El seguimiento queda vinculado a esta visita.”, notes, future dates, Descargar resumen and Ver seguimiento. No errors or remaining confusion on this bounded journey.
- The application footer also exposes the privacy/use link. No browser data deletion or external transmission performed.

After screenshots: [privacy and usage](skeptic-after-privacy.png), [information guide](skeptic-after-info.png), [first success](skeptic-after-success.png).

## Final shared-Modal regression — 2026-10-28

Fresh origin http://localhost:61832/clinicas/, final build identified by coordinator as `index-BfLqcRCW.js`, real Chrome default desktop size. Repeated landing → privacy/use page (including free scope, use and price) → Demo → information icon → guide → Abrir agenda → Nina confirmed appointment → Iniciar consulta → fictional assessment/instructions → Finalizar consulta. **PASS:** guide opened and navigated cleanly; consultation became Atendida with linked followup, no unexpected discard warning, no remaining issue on the route. Viewport unchanged. Evidence: [final success](skeptic-final-success.png).
