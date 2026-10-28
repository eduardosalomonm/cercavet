# Breaker persona — baseline

Date: 2026-10-28. Build baseline: 307ff40. Real Chrome tab, isolated origin `http://127.0.0.1:61735/clinicas/`. Desktop viewport left unchanged. No source inspection or implementation changes.

## Journey and first success

Landing → top “Probar la demo” → “Nueva cita” → Milo → whitespace-only Motivo → double-click Crear cita. The app correctly rejected whitespace with “Indica el motivo de la cita.” No booking was created.

Replaced Motivo with “Revisión ficticia pendiente de guardar”, then pressed browser Back mid-form. Browser went to landing. Forward restored the form, selected Milo, reason and time via browser page restoration. **No data loss was observed in this Back/Forward test.** Replaced reason with literal `<b>Revisión ficticia</b>` and double-clicked Crear cita. Success: exactly one 16:00 Milo booking appeared; day count increased 7→8 and success notice appeared. The HTML was shown literally, not interpreted as markup. This is a successful safety behavior, not a vulnerability.

## Findings

### BREAKER-BACK-EXIT — P2 navigation surprise

- Repro: open landing, enter demo, Nueva cita, select Milo and enter a reason; use browser Back.
- Expected: return from the open form to the application, or clearly protect the in-progress form before leaving the application.
- Actual: Back immediately leaves the app for the landing, despite the form looking like the current navigation step. Forward restores the form in this browser; do not characterize this as proven data loss.
- Affected persona count: 1 (breaker).
- Evidence: `breaker-before-back-filled.png` and `breaker-before-back-exits-app.png`.

### BREAKER-STALE-ERROR — P3 confusing validation feedback

- Repro: submit whitespace-only Motivo, then replace it with a valid nonblank reason.
- Expected: the “Indica el motivo de la cita” error clears when the missing reason is provided, or is explicitly identified as feedback from the previous attempt.
- Actual: the error remains visible next to the now-filled form until another submission. It also remains after Back/Forward restoration.
- Affected persona count: 1 (breaker).
- Evidence: `breaker-before-back-filled.png` contains the valid reason with the obsolete error.

## Evidence files

- `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/breaker-before-back-filled.png`
- `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/breaker-before-back-exits-app.png`
- `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/breaker-before-success.png`

## Limits

Focused first-success journey tested whitespace, literal HTML, interrupted navigation and double-submit. It is not a comprehensive security assessment or proof for every field. Browser Back/Forward retained data; refresh/eviction recovery was not tested. No external messages or real data used. No browser viewport changes.

## Rerun after first correction pass

Fresh origin `http://127.0.0.1:61835/clinicas/`, real Chrome, same unchanged desktop viewport. Followed landing → demo → Nueva cita.

- **BREAKER-STALE-ERROR: PASS.** Whitespace was rejected. Replacing it with `Revisión ficticia pendiente de guardar` immediately removed the old error. Screenshot: `breaker-after-error-cleared.png`.
- **BREAKER-BACK-EXIT: NOT VERIFIED AS FIXED.** Calling browser Back from that populated modal still went directly to the landing. The documented `getJsDialog()` API returned `undefined`, and a screenshot showed the landing. No unsaved-work prompt was observed in this automation. Forward again restored the form values, so no data loss was observed. Screenshot: `breaker-after-back-unprotected.png`. A native beforeunload handler may be affected by automation or browser behavior; this run does not establish that the safeguard works.
- **First success: PASS.** Replaced reason with literal `<b>Revisión ficticia</b>`, double-clicked Crear cita, and saw exactly one 16:00 Milo appointment with literal text. Day count 7→8. Screenshot: `breaker-after-success.png`.

All after screenshots are in `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/`. Browser released; no viewport changes. Follow-up verification needed for Back protection before claiming all findings fixed.

## Final rerun — in-app Back protection verified

Fresh origin `http://localhost:61835/clinicas/`, real Chrome, desktop viewport unchanged. This final result supersedes the unsuccessful native-warning verification above.

1. Landing → top Probar la demo → Nueva cita → select Milo → whitespace Motivo → double-click Crear cita: validation rejected it correctly.
2. Entered `Revisión ficticia pendiente de guardar`: obsolete error disappeared immediately (exact error text count zero).
3. Browser Back stayed at `http://localhost:61835/` and displayed **“Tienes cambios sin guardar. Puedes seguir editando o descartar este formulario. Los registros ya guardados se conservan.”**, with Seguir editando and Descartar cambios y cerrar. Screenshot `breaker-final-back-protected.png`.
4. Clicked Seguir editando. DOM-backed field reads confirmed Milo and the full reason were retained; obsolete error remained absent. Screenshot `breaker-final-retained-form.png`.
5. Replaced reason with literal `<b>Revisión ficticia</b>` and double-clicked Crear cita. Exactly one matching 16:00 Milo appointment, day count 7→8, successful save, literal HTML. Screenshot `breaker-final-success.png`.
6. Opened another Nueva cita without editing it, then used browser Back. Returned to app dashboard, zero dialogs, same app URL, and no false unsaved warning. Screenshot `breaker-final-clean-back.png`.

**Final verdict:** BREAKER-BACK-EXIT PASS; BREAKER-STALE-ERROR PASS; first-success journey PASS; whitespace, literal HTML and double-submit regression checks PASS. No remaining blocker observed in this focused persona. No browser-wide resize or external messages.
