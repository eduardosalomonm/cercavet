# Persona 1 — El impaciente

Fecha: 28 de octubre de 2026. Primera pasada sobre `307ff40`.
Navegador real: Chrome, origen aislado `http://127.0.0.1:61731/clinicas/`. Sin cambiar viewport ni datos de otros usuarios. No se inspeccionó el código para escoger acciones.

## Recorrido

1. Abrir landing y escanear el titular y el primer CTA «Probar la demo» de la cabecera.
2. Pulsarlo; abre el panel Hoy sin registro.
3. Pulsar la acción principal «Nueva cita».
4. Escoger «Milo · Elena Rivas», escribir «Revisión de prueba» y conservar los valores propuestos (28/10/2026, 16:00, 30 minutos, Dra. Alba Martín).
5. Pulsar «Crear cita».

## Resultado

**Primer éxito alcanzado:** el diálogo se cierra, aparece «Cita añadida a la agenda.», el contador pasa de 7 a 8 y figura la cita de Milo a las 16:00. No se encontró un error de producto ni bloqueo antes de este primer éxito. Se detuvo el recorrido aquí según el personaje.

No se inventan problemas para cumplir una cuota: este recorrido concreto aportó **0 hallazgos** a la clasificación por frecuencia.

Evidencia: [éxito de primera reserva](impatient-before-success.png).
Ruta absoluta: `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/impatient-before-success.png`.

## Limitación de esta pasada

La regla de este personaje es abandonar ante el primer error, pero no apareció ninguno. Se usaron un paciente existente y el horario predeterminado libre. No cubre la elección de un horario ocupado, alta de un paciente nuevo ni consulta completa; esas variantes corresponden a otros recorridos.

Una búsqueda de campo del controlador por etiqueta falló; la instantánea DOM mostró el formulario intacto y la interacción por rol funcionó. Fue una incidencia de automatización, no un error presentado al usuario y no se cuenta como hallazgo del producto.

## Repetición tras correcciones

Fecha: 28 de octubre de 2026. Build corregido servido en el origen nuevo `http://127.0.0.1:61831/clinicas/`, sin datos guardados del ensayo anterior. Chrome real; tamaño de escritorio predeterminado, sin modificar viewport.

Se repitió exactamente **primer CTA → Nueva cita → Milo · Elena Rivas → Revisión de prueba → Crear cita**, conservando fecha actual, 16:00, 30 minutos y Dra. Alba Martín. **PASA:** mensaje «Cita añadida a la agenda.», contador 7 → 8 y cita de Milo visible a las 16:00. Ningún error de producto antes del primer éxito; se detuvo el recorrido ahí. Continúa con 0 hallazgos de este personaje, sin atribuirle arreglos de problemas que no observó.

Evidencia después: [primer éxito conservado](impatient-after-success.png).
Ruta absoluta: `/Users/edu/VirtualMachines/Consultoria/clinica-base/docs/qa-launch/impatient-after-success.png`.

## Comprobación final del guardado de ventanas

Tras el ajuste final de protección de formularios, nueva pasada desde `http://localhost:61831/clinicas/` (origen limpio independiente de 127.0.0.1). Se repitió el mismo recorrido: primer CTA → Nueva cita → Milo → motivo «Revisión de prueba» → Crear cita, con valores propuestos. **PASA:** guarda, cierra el diálogo y muestra «Cita añadida a la agenda.», contador 8 y fila de Milo a las 16:00. **No apareció ninguna confirmación de descarte al guardar.** Sin errores antes del primer éxito; sin cambios de viewport.

Evidencia final: [reserva guardada sin confirmación extra](impatient-final-success.png).
