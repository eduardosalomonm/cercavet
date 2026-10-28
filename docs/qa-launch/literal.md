# Persona 4 — usuario literal

Fecha: 28 de octubre de 2026. Base: `307ff40`. Chrome real, origen aislado `http://127.0.0.1:61734/clinicas/`. Sin inspección del código, sin cambiar el viewport compartido. Perfil: sigue únicamente los textos visibles; el público es hispanohablante, por lo que no se inventó un requisito de traducción al inglés.

## Recorrido y primer éxito

1. Landing → «Cómo funciona»: instrucciones explícitas para probar con Milo.
2. «Probar la demo» → cita de Milo, 09:30, en sala de espera.
3. «Iniciar consulta» → rellenar valoración, observaciones e indicaciones ficticias → «Finalizar consulta».
4. Primer éxito confirmado: «Consulta finalizada. El seguimiento queda vinculado a esta visita» y el contenido conservado. No apareció error ni bloqueo.
5. Se siguió hasta el final anunciado: «Ver seguimiento» → «Registrar contacto de prueba» → respuesta ficticia → «Necesita revisión» → «Guardar respuesta» → «Reservar revisión» con fecha/hora propuestas.
6. Nueva reserva confirmada: Milo, 11 de noviembre, 16:00, Dra. Alba Martín, con enlace al seguimiento anterior. Las indicaciones sí aparecían en el mensaje preparado y el carácter simulado era explícito.

## Hallazgo observado

### FLOW-COMPLETION — P3: el recorrido sigue mostrando «04 Nueva reserva» pendiente/activo después de crearla

- Pasos: completar los seis pasos anteriores; tras «Reservar revisión», el modal se cierra y vuelve a la consulta original. Esperar a que desaparezca el aviso breve.
- Esperado literalmente: cuatro pasos terminados y confirmación persistente de la revisión con acceso directo a ella.
- Real: Cita, Consulta y Seguimiento tienen marca de verificación; «04 Nueva reserva» conserva el número y aspecto de paso actual. La página mantiene solo «Consulta finalizada» y «Revisión propuesta 11 nov». El panel lateral todavía dice «ANTES DE EMPEZAR» y «Al finalizar, tendrás…» aunque la consulta ya terminó.
- Fricción: parece faltar el último paso. Para comprobar que sí terminó tuve que volver a «Ver seguimiento», donde aparece «La nueva visita ya está en la agenda» y «Ver nueva reserva».
- Impacto: confusión recuperable; no impide el primer éxito ni pierde datos.
- Evidencia: `literal-before-02-reservation-not-complete.png`.
- Sugerencia: marcar los cuatro pasos como completados cuando hay nueva reserva y mostrar fecha/hora y enlace de la reserva en la visita original; ajustar el texto lateral al estado finalizado.

## Evidencia visual

- `literal-before-01-milo-promise.png`: recorrido indicado por la landing, referencia de partida, no un fallo.
- `literal-before-success.png`: primer éxito, consulta registrada.
- `literal-before-02-reservation-not-complete.png`: punto de confusión.
- `literal-before-final-success.png`: nueva cita confirmada y vinculada.

Todos los archivos están en `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/`. No se observó otro problema material de comprensión en este recorrido. No se cambió código ni configuración del navegador.

## Repetición tras correcciones — aprobada

Se repitió el recorrido completo en Chrome real con datos nuevos en `http://127.0.0.1:61834/clinicas/`, sin inspeccionar código ni cambiar el viewport. Landing → Milo → iniciar consulta → valoración/observaciones/indicaciones ficticias → finalizar → contacto de prueba → respuesta → reservar revisión.

- Primer éxito: consulta finalizada, sin errores ni bloqueos.
- FLOW-COMPLETION corregido: las cuatro etapas tienen marca de verificación después de reservar. El resumen dice **Revisión reservada 11 nov · 16:00** y mantiene un panel **Recorrido completado · revisión reservada**, con día, hora, profesional y botón **Ver nueva reserva**.
- La confirmación permanece después de desaparecer el aviso temporal (comprobado con una nueva lectura del estado de la página).
- La barra lateral ya dice **DATOS DEL PACIENTE** y **La próxima visita está lista**, con instrucciones coherentes con el estado terminado.
- El botón directo abre la cita correcta de Milo del 11 de noviembre a las 16:00, confirmada y vinculada al seguimiento anterior, sin tener que buscarlo en un modal.
- No aparecieron nuevas confusiones, errores o regresiones en este recorrido.

Evidencia: `literal-after-01-completed-flow.png` (página completa con los cuatro pasos y confirmación persistente), `literal-after-02-direct-booking.png` (cita vinculada abierta desde el nuevo botón).

## Regresión final de protección de formularios — aprobada

Repetición adicional desde origen nuevo `http://localhost:61834/clinicas/` sobre la compilación final comunicada `index-BfLqcRCW.js`, después del último ajuste del modal común. Landing → Milo → iniciar/finalizar consulta → registrar contacto → guardar respuesta → reservar revisión → abrir revisión directamente.

Todos los guardados y cambios de etapa ocurrieron sin confirmaciones de descarte inesperadas, diálogos nativos ni bloqueos. Se mantienen las cuatro verificaciones, el panel persistente de recorrido completado y el enlace correcto a Milo, 11 de noviembre, 16:00, Dra. Alba Martín. No se detectó regresión. Evidencia final: `literal-final-success.png`.

## Cierre después de guardar dentro del modal — aprobado

Comprobación puntual en la compilación comunicada `index-CkXFv137.js` sobre `localhost:61834`, con el seguimiento pendiente de Bruno. Se editó el mensaje, se pulsó **Registrar contacto de prueba** y se cerró mediante la X: cierre inmediato, sin aviso de descarte. Se reabrió el mismo seguimiento, se escribió y guardó una respuesta ficticia y se cerró de nuevo mediante la X: cierre inmediato, sin aviso. La tarjeta de Bruno conserva la respuesta y muestra **Preparar revisión**. Evidencia: `literal-saved-followup-close.png`. Sin cambios de viewport.
