# CercaVet · Briefing de landing

Actualizado el **17 de octubre de 2026**, actualizado para la P1 de vacunaciones y la [hoja de ruta local](MEJORAS.md). La lista de funciones disponibles en la landing se amplía con el registro local de vacunas y próximas dosis.

## Público, propósito y mensaje

Público inicial: clínicas veterinarias que necesitan dar continuidad a citas, consultas y revisiones. El primer posible piloto es la clínica de un amigo del usuario en Venezuela; su software y procesos actuales siguen por conocer.

Objetivo: que el veterinario entienda el recorrido, pruebe la demo y pueda concretar qué adaptar a su clínica. Propuesta central: **«El cuidado continúa después de la consulta.»** CercaVet es el producto de Eilvi; la aplicación puede mostrar la identidad de la clínica.

Mantener el acceso principal a [Probar la demo](https://eduardosalomonm.github.io/cercavet/), desde la [landing para clínicas](https://eduardosalomonm.github.io/cercavet/clinicas/). No hay formulario comercial operativo ni canal de contratación dentro de CercaVet. Cualquier futuro contacto necesita un destino real acordado.

## Estado de cada promesa

| Categoría | Qué se puede comunicar | Precisión necesaria |
| --- | --- | --- |
| Funciona localmente | Agenda interna, pacientes, notas, historial básico, seguimiento vinculado, nueva reserva y exportación JSON | Una clínica/un profesional; datos ficticios guardados en ese navegador. No sincroniza el trabajo entre dispositivos. |
| Funciona localmente | Nombre, frase, contacto, profesional, logo y tres paletas; título y favicon de la clínica | Personalización visual, sin dominio ni backend configurables. El profesional es una etiqueta, no un miembro del equipo con permisos. |
| Funciona localmente | Resumen de visita con nombre y contacto de la clínica | Descarga TXT. No prometer PDF con logo, firma, recetas, portal documental ni conservación de la identidad original al volver a descargar. |
| Simulado | Preparar un mensaje, registrar contacto de prueba y respuesta de ejemplo | No se envía WhatsApp/correo ni se recibe una respuesta del propietario. |
| Ilustrativo | Cambiar nombre y color en la vista de marca blanca de la landing | No guarda cambios ni configura una clínica; el editor de la aplicación sí conserva la identidad local. |
| Funciona localmente | Vacunas, lotes, fechas de aplicación, próximas dosis y vencimientos con seguimiento único | P1 entregada. Incluye correcciones con motivo y dosis enlazadas; los vencimientos son de próximas dosis, no de inventario. No incluye pautas clínicas ni avisos automáticos. |
| Planificado, no iniciado | P2 portal y equipo/catálogo | No están implementados. Evitar fechas de entrega sin alcance acordado. |
| Requiere implementación y activación externa | Cuentas, backend, archivos privados, copias, mensajería, dominio y eventualmente banco/pagos | No hay un conector terminado esperando solo una clave. Antes de prometer servicio operativo, probar efecto externo, fallo, permisos y recuperación. |
| Aplazado | Facturación fiscal, suscripciones SaaS y superadministración | No forman parte de la demo ni del siguiente incremento priorizado. |

## Estructura que conservar

1. **Presentación y demo:** mensaje de continuidad, captura de la aplicación real y aviso visible de datos de ejemplo/contactos simulados.
2. **Beneficios demostrables:** ver las visitas y seguimientos, recuperar contexto y preparar la revisión. Sin porcentajes de ahorro, testimonios ni resultados no medidos.
3. **Recorrido:** cita → consulta → seguimiento de prueba → nueva reserva. Identificar al paciente como ficticio.
4. **Marca blanca:** nombre, logo, colores y contacto; explicar qué se personaliza hoy y qué se acordaría para una implantación.
5. **Alcance:** separar «Disponible en la demo» de «A definir para tu clínica». Las dependencias de producción no son funciones incluidas actualmente.
6. **Preguntas frecuentes:** sin registro, almacenamiento local, contactos simulados y necesidad de revisar el programa actual antes de hablar de integración o sustitución.
7. **Cierre:** repetir acceso a la demo; mantener precio sujeto al alcance, sin anunciar contratación o cobros activos.

## Cómo comunicar las próximas prioridades

- **Vacunaciones — P1 disponible en la demo:** «Registra vacunas, próximas dosis y vencimientos enlazados al seguimiento». Incluye lote, fechas, histórico y correcciones; hay ejemplos para probarlo. No equivale a recordatorios automáticos entregados.
- **Portal — P2 propuesta:** «Portal del propietario por definir para el piloto». No anunciar acceso privado ni documentos compartidos hasta probar autenticación, autorización y revocación. Un prototipo con selector de propietario se rotularía como demo.
- **Equipo y servicios — P2 propuesta:** «Agenda para varios profesionales según las necesidades de la clínica». Para comunicarlo como disponible, deben funcionar asignación, disponibilidad por profesional y control de solapamientos; los permisos reales necesitan backend.
- **Cobros en Venezuela — hipótesis por validar:** conservarla para la conversación de alcance. No anunciar caja Bs/USD, verificación de Pago Móvil ni facturación: no están implementadas. Confirmar métodos, monedas y banco antes de diseñar la integración.

## Diferencias detectadas al contrastar el inventario

El inventario central resume la marca aplicada a documentos y mensajes. El alcance comprobado es más concreto: el logo se aplica a navegación/favicon; el resumen descargable es texto con nombre y contacto. Los mensajes ya registrados conservan su contenido, pero no existe un sistema de documentos emitidos con identidad congelada. El briefing mantiene esta diferencia para evitar ampliar la promesa.

La landing actual ya distingue demo e implantación y describe los resúmenes «con tu nombre». Anuncia vacunaciones y próximas dosis como disponibles en la demo. P2 sigue pendiente. Un sistema integral de clínica, las conexiones bancarias y la facturación fiscal permanecen fuera de la promesa actual.

## Evidencia y regla de actualización

- Experiencia actual: [index.html](../public/clinicas/index.html) y [landing.js](../public/clinicas/landing.js).
- Reglas y entidades: [domain.ts](../src/domain.ts); persistencia: [store.ts](../src/store.ts).
- Identidad: [settings.tsx](../src/settings.tsx), [branding.ts](../src/branding.ts), [App.tsx](../src/App.tsx).
- Resumen descargable: `exportVisit` en [consultation.tsx](../src/consultation.tsx).
- Verificación del 17 de octubre de 2026: 24 pruebas de dominio e identidad, build y recorrido manual en escritorio/móvil; no son pruebas de entrega externa ni aislamiento.

Antes de ampliar una promesa, registrar en [MEJORAS.md](MEJORAS.md) el estado demostrado, la prueba y los límites. Una función local no se anuncia como servicio conectado; una propuesta no se anuncia como desarrollo activo. La publicación de P1 acompaña esta actualización de la demo.
