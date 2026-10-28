# CercaVet · QA de lanzamiento con cinco perfiles

Fecha: **28 de octubre de 2026**. Base: `307ff40`. Cinco subagentes distintos, recorridos reales en Chrome desde la landing hasta un primer resultado guardado; el perfil literal también completó la revisión anunciada. Se usó la compilación local del producto, no datos reales ni envíos externos.

## Hallazgos ordenados por usuarios afectados

La frecuencia cuenta **perfiles que lo observaron**, no clics, reproducciones ni personas reales. Todos los hallazgos confirmados empatan en **1 de 5**; se desempata por gravedad. No se atribuyen problemas a los otros perfiles por suponer que también les afectarían.

| Orden | Problema observado | Frecuencia | Prioridad | Corrección y evidencia inicial |
| --- | --- | --- | --- | --- |
| 1 | Pantalla vacía al entrar en la demo con conexión lenta | 1/5 · móvil | P2 | HTML inicial con estado de carga, regreso a la presentación y reintento tras 15 s. [Captura inicial](mobile-before-loading.png), [alcance de la evidencia](mobile.md). |
| 2 | No hay información accesible suficiente sobre privacidad y uso de la demo | 1/5 · escéptico | P2 | Página factual enlazada junto al CTA, en el pie comercial y en la app: almacenamiento, ordenador compartido, borrado, límites, gratuidad y precio por alcance. [Antes](skeptic-before-trust-footer.png). |
| 3 | Atrás sale del formulario a la landing sin proteger el trabajo | 1/5 · breaker | P2 | Paso de historial de la app y confirmación visible para seguir editando o descartar. Se conserva el formulario al permanecer. [Antes](breaker-before-back-exits-app.png). No se observó pérdida de datos: Adelante los recuperó en el caso inicial. |
| 4 | La revisión ya reservada parece un paso todavía pendiente | 1/5 · literal | P3 | Cuatro pasos completados, confirmación persistente con fecha/hora/profesional, enlace directo y textos laterales según el estado. [Antes](literal-before-02-reservation-not-complete.png). |
| 5 | El error de motivo vacío sigue visible tras corregir el campo | 1/5 · breaker | P3 | Limpiar el mensaje anterior al editar; validar de nuevo al enviar. Se aplica también a los otros formularios. [Antes](breaker-before-back-filled.png). |

El perfil impaciente no encontró errores en su primer recorrido: reservó una cita y se detuvo en ese primer éxito. No se inventa un hallazgo para completar una cuota.

Observación adicional del escéptico: el icono de información no produjo una respuesta visible una vez. No se confirmó un manejador roto. La inspección mostró una barra lateral fija sin desplazamiento vertical, con ayuda bajo el borde de una ventana baja. Se añadió desplazamiento y un área de pulsación de 44 px; la repetición sí abrió la guía. Se conserva esta incertidumbre y no se suma a la frecuencia de fallos confirmados.

## Corrección y repetición

Se consolidaron las correcciones en una entrega. La primera repetición del breaker mostró que el aviso nativo `beforeunload` no era suficiente en este recorrido de navegador: no se declaró resuelto. Se añadió protección dentro de la aplicación y se repitió la validación de los cinco recorridos. Una comprobación adicional verificó que cerrar un contacto o una respuesta ya guardados no mostrase un aviso falso.

La compilación de las repeticiones de escritorio es `index-BfLqcRCW.js`; el ajuste adicional de cierre de seguimientos y la repetición móvil usan `index-CkXFv137.js`. Ambas usan `index-spSwer8j.css`. La última compilación es la entrega verificada. El botón de reintento de carga a los 15 segundos no llegó a aparecer en la repetición porque la app cargó antes: no se presenta como comprobado en navegador. Las cinco repeticiones finales se registran en los informes individuales:

| Perfil | Primera pasada | Repetición final | Informe |
| --- | --- | --- | --- |
| Impaciente | Reserva guardada; 0 problemas | PASS · una cita; sin aviso al guardar | [Informe](impatient.md) |
| Escéptico | Consulta finalizada; falta información de privacidad | PASS · privacidad, precio y guía; consulta finalizada | [Informe](skeptic.md) |
| Móvil | Reserva guardada; carga vacía | PASS · estado de carga a 375 px; reserva guardada; sin desbordamiento | [Informe](mobile.md) |
| Literal | Consulta y nueva reserva guardadas; cierre confuso | PASS · cuatro pasos, reserva persistente y enlace; cierre de seguimiento guardado | [Informe](literal.md) |
| Breaker | Una reserva, sin duplicado ni HTML ejecutado; Atrás y error obsoleto | PASS · confirmación, datos conservados, error actualizado, una sola reserva | [Informe](breaker.md) |

## Evidencia posterior a las correcciones

- Impaciente: [reserva sin fricción](impatient-final-success.png).
- Escéptico: [información de privacidad](skeptic-after-privacy.png), [consulta finalizada](skeptic-final-success.png).
- Móvil: [carga a 375 px](mobile-after-loading.png), [reserva guardada](mobile-after-success.png).
- Literal: [recorrido completado](literal-final-success.png), [seguimiento guardado sin aviso falso al cerrar](literal-saved-followup-close.png).
- Breaker: [Atrás protegido](breaker-final-back-protected.png), [datos conservados](breaker-final-retained-form.png), [una reserva](breaker-final-success.png), [Atrás sin cambios](breaker-final-clean-back.png).

**Resultado:** los cinco perfiles alcanzan el primer éxito; los cinco hallazgos confirmados quedan resueltos en sus recorridos de repetición. Ningún fallo confirmado pendiente dentro de este alcance.

## Método y límites

- Orígenes aislados: `127.0.0.1:61731–61735` para la base, `127.0.0.1:61831–61835` y sus orígenes `localhost` para las repeticiones. El servidor solo escucha en loopback; cada perfil tiene su almacenamiento independiente.
- Móvil: Chrome real a **375 × 812**, con servidor limitado a **50.000 bytes/s agregados y 2 s de latencia por solicitud**. Aproxima 3G lento; no es un teléfono físico ni la emulación de red nativa de Chrome. No se afirma una medición de rendimiento de producción.
- La captura guardada del blanco inicial reproduce el problema con ancho de escritorio. El estado vacío también se observó a 375 px, pero esa primera captura no se guardó antes del montaje. El informe móvil conserva esta limitación; no se etiqueta esa imagen como prueba de 375 px.
- Las imágenes de estado/confusión y de éxito están junto a cada informe. Las pruebas usan información ficticia. Los fallos del controlador de navegador no se cuentan como fallos del producto.
- No se probó un servicio de pago, registro, mensajería real ni aislamiento multiusuario: esta demo no los ofrece. No es una auditoría de seguridad, asesoramiento legal ni investigación con cinco personas reclutadas.
- `npm test`: **26 aprobadas**, sin fallos. `npm run build`: TypeScript y compilación correctos. Estos tests conservan las reglas de datos; el recorrido visual, carga y navegación se comprueban en navegador.
