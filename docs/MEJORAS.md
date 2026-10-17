# CercaVet · Mejoras y hoja de ruta

Revisión: **17 de octubre de 2026**. P1 implementada sobre la base `6be26da`. Responsable: chat de CercaVet. Esta entrega añade vacunaciones a la demo local y su publicación en GitHub Pages; no integra proveedores.

## Decisión de alcance

Mantener como núcleo **cita → consulta → seguimiento → nueva reserva**. Se ha implementado **vacunaciones con vencimientos y seguimiento vinculado** como P1 de la demo. Portal del propietario y equipo/catálogo quedan como P2, sujetos a lo que requiera el piloto. No convertir el producto en un ERP clínico antes de validar la demanda.

El usuario confirmó que la clínica de su amigo está en **Venezuela**; todavía no sabemos qué programa utiliza, cuántos profesionales trabajan ni cómo registra cobros. La investigación previa de este chat propuso agenda ampliada y cobros Bs/USD. Se conserva como hipótesis por validar, no como implementación autorizada ni módulo en desarrollo. El orden documental actual incorpora las prioridades trasladadas desde la revisión del portafolio.

Fuentes de coordinación, consultadas sin modificarlas: [auditoría funcional](../../eilvi-portafolio/AUDITORIA_FUNCIONAL.md), ficha `clinica-base` de [CAPACIDADES.json](../../eilvi-portafolio/CAPACIDADES.json) y [contrato de marca blanca y producción](../../eilvi-portafolio/MARCA_BLANCA_Y_PRODUCCION.md). El código propio y la evidencia reciente prevalecen ante un inventario desactualizado. Las funciones de la referencia orientan requisitos; no se reutiliza su código ni sus recursos.

## Estado real y evidencia

| Capacidad | Estado al revisar | Evidencia y límite |
| --- | --- | --- |
| Cita, consulta, seguimiento y nueva reserva | Resuelto localmente | [domain.ts](../src/domain.ts): `bookAppointment`, `finishConsultation`, `contactFollowup`, `replyFollowup` y `cancelAppointment`. [Pruebas del recorrido](../tests/workflow.test.mjs): vínculos, duplicados, solapamientos y reapertura al cancelar una revisión. Una agenda, un profesional, horario 09:00–20:00. |
| Pacientes, historial y notas | Resuelto localmente, alcance básico | [workspace.tsx](../src/workspace.tsx), [consultation.tsx](../src/consultation.tsx). Borrador, valoración, hallazgos, peso e indicaciones. `Patient.owner` es texto; no existe una entidad de propietario con acceso propio. |
| Contacto y respuesta del seguimiento | Simulado | [forms.tsx](../src/forms.tsx) registra contacto de prueba y respuesta introducida por el equipo. No entrega mensajes ni recibe respuestas externas. |
| Identidad de la clínica | Resuelto localmente, parcial respecto al contrato común | [settings.tsx](../src/settings.tsx), [branding.ts](../src/branding.ts), [App.tsx](../src/App.tsx) y [pruebas de identidad](../tests/identity.test.mjs). Nombre, frase, logo, contacto, etiqueta de profesional, tres paletas, título y favicon. Sin dominio, backend ni aislamiento por cliente. |
| Mensajes y resúmenes con la marca | Local, con límites | `saveBrand` actualiza el nombre en mensajes pendientes y conserva los ya registrados. `exportVisit` descarga texto con nombre, frase, profesional y contacto vigentes: no incluye logo ni PDF, ni conserva una copia inmutable de la identidad de emisión. |
| Guardado y exportación | Local, parcial | [store.ts](../src/store.ts): `localStorage`, validación y sincronización básica entre pestañas. [settings.tsx](../src/settings.tsx): exportación JSON. No hay importación, restauración de una copia, colaboración entre dispositivos ni respaldo remoto. «Restaurar datos de ejemplo» reinicia la demo; no restaura una copia operativa. |
| Landing y kit visual | Entregados | [landing](../public/clinicas/index.html), [vista de marca](../public/clinicas/landing.js) y [guía visual](BRAND.md). La lista de capacidades disponibles incluye vacunaciones y próximas dosis de la demo. |
| Vacunaciones y vencimientos | Resuelto localmente | [Dominio de vacunación](../src/vaccination-domain.ts), [vista](../src/vaccinations.tsx) y [pruebas](../tests/vaccinations.test.mjs). Lote, aplicación, próxima dosis, correcciones con motivo, relación entre dosis y un seguimiento por registro. Sin pautas ni avisos automáticos. |
| Portal y equipo/catálogo | Ausentes; planificados como P2 | No hay entidades ni recorridos para estas capacidades. |
| Cobros, presupuestos, facturación, inventario | Ausentes | Sin entidades, vistas, proveedor ni configuración de activación. |

**Verificación de P1:** 24 pruebas de dominio e identidad; build TypeScript/Vite y revisión manual de escritorio/móvil. Los casos incluyen migración v1, duplicados, límites de 30 días, medianoche de Caracas, correcciones, cancelación de reserva y nueva dosis. No prueban permisos ni entrega externa. El recorrido manual conserva los datos anteriores y enlaza contacto → respuesta → reserva → siguiente dosis → histórico tras recargar.

## P1 · Vacunaciones y continuidad del cuidado

**Estado:** implementada en la demo con datos ficticios. **Motivo:** añade prevención al mismo recorrido de seguimiento, sin abrir un módulo comercial independiente.

Alcance implementado y comprobado:

1. Registrar paciente, vacuna, lote, fecha de aplicación y próxima dosis indicada por el veterinario; conservarlos tras recargar. Distinguir lote de vacuna de vencimiento de la próxima dosis.
2. Mostrar próximas dosis y vencidas, con fecha y texto de estado. Definir la ventana de «próximas» y el caso «vence hoy»; calcularlos con la zona horaria de la clínica. No inferir pautas clínicas automáticamente.
3. Crear un seguimiento vinculado a esa vacunación y paciente. Repetir la acción, recargar o reintentar no puede producir un segundo seguimiento para el mismo vencimiento; debe abrirse el existente.
4. Conservar el vínculo al registrar contacto/respuesta y organizar una revisión. Una nueva dosis crea su propio registro; no reescribe la anterior ni su historial de contacto.
5. Corregir una fecha sin perder trazabilidad ni dejar dos seguimientos abiertos por el mismo motivo. Verificar fechas inválidas, cambio de día y cancelación de una reserva vinculada.
6. Migrar el estado local existente sin perder citas, consultas, identidad o seguimientos. Mantener los casos actuales de no duplicación.

**Modelo implementado:** `Followup` distingue `source: consultation | vaccination`; una vacunación puede asociarse a una consulta del mismo paciente, sin crear consultas ficticias. Cada aplicación tiene un único seguimiento, con identificador estable y validación de duplicados. Una dosis siguiente enlazada conserva la anterior y cierra su seguimiento con motivo `dose-recorded`. Cancelar una cita no reabre ese vencimiento ya cubierto. Una corrección mantiene el seguimiento y registra los valores anteriores y el motivo.

La demo nueva incluye cuatro ejemplos relativos al día de inicio. Para instalaciones previas, **Cargar ejemplos de vacunas** añade cuatro pacientes ficticios sin borrar datos ni reinsertarlos al repetir la acción. Se distingue vencida, hoy, próximos 30 días, más adelante e histórico; el día se calcula en la zona de la clínica y se revisa cada minuto o al volver a la pestaña. No hay avisos automáticos ni envío real. El esquema v2 migra el almacenamiento v1 conservando citas, consultas, borradores, marca y seguimientos.

## P2 · Portal del propietario y documentos compartidos

**Estado:** pendiente de implementación. **Motivo:** permitir que la familia participe en el seguimiento.

- Crear identidad y relación explícitas entre propietario y mascotas; no usar el nombre escrito en una ficha como autorización.
- Consultar solo sus mascotas, seguimiento autorizado y documentos que la clínica haya compartido expresamente; mantener notas internas privadas por defecto.
- Solicitar una revisión y mostrar su estado. Una solicitud no reserva un hueco hasta que las reglas de disponibilidad y confirmación la acepten.
- Controlar emisión, versión y revocación de documentos compartidos; registrar quién modifica y quién comparte. Un PDF o archivo no se vuelve público por conocer su URL.
- Cierre operativo: probar dos propietarios y dos clínicas, incluyendo peticiones directas a la API y descargas. No debe haber lectura ni modificación cruzada; revocar acceso debe impedir nuevas consultas o descargas.

Un selector de propietario en una futura demo solo demostraría la experiencia. El cierre de privacidad exige autenticación y permisos de servidor, además del control de archivos.

## P2 · Equipo y catálogo de servicios

**Estado:** pendiente; adelantar solo si el piloto necesita varios profesionales.

- Separar profesionales y usuarios de la etiqueta `brand.veterinarian`; asignar cada cita a un profesional identificable.
- Catálogo configurable con servicio, duración, profesionales habilitados y horarios. No presupone facturación.
- Cierre: rechazar citas solapadas del mismo profesional y permitirlas entre profesionales distintos cuando no compartan un recurso limitado. Respetar bloqueos y comprobar reprogramaciones.
- Definir permisos de recepción, veterinario y responsable; verificarlos en servidor para uso real, también ante intentos de cambiar IDs. Un filtro de agenda no es control de acceso.
- Mantener autor/profesional históricos de las consultas aunque cambie el nombre o se desactive un miembro del equipo. Migrar las citas de la demo a un profesional inicial sin perder relaciones.

## Exploración posterior y funciones aplazadas

| Tema | Decisión actual | Qué falta aprender |
| --- | --- | --- |
| Registro de cobros y presupuestos | Hipótesis conservada de la investigación previa, sin prioridad de ejecución asignada | Cómo cobra y cierra caja la clínica, monedas, abonos, verificación y banco utilizado. Si se desarrolla, conservar importe/moneda/tasa/fecha originales; separar pago pendiente de confirmado. |
| Reserva pública, recordatorios e inventario | Evaluar tras validar el recorrido prioritario | Volumen de solicitudes, comunicaciones y venta o uso de productos; decidir qué se integra y qué necesita desarrollo propio. |
| Facturación fiscal | Aplazada | Requisitos del negocio en Venezuela y revisión específica con su contador; no confundir un recibo interno con facturación fiscal implementada. |
| Suscripciones SaaS y superadministración | Aplazadas | Piloto operativo y segunda clínica con separación demostrada antes de añadir planes o administración transversal. |
| Hospitalización, cirugía e IA | Fuera del incremento actual | Demanda observada y alcance clínico acordado; no presentarlas como disponibles. |

## Condiciones para un piloto real

Estas condiciones son dependencias de producción, no capacidades terminadas ni un encargo de activación:

1. **Datos y acceso:** autenticación, permisos por clínica/persona, archivos privados y comprobación de reglas críticas en servidor. Probar concurrencia y separación entre dos clínicas.
2. **Historia clínica:** autor, fecha e historial de cambios; edición controlada de registros cerrados y compartición explícita/versionada de documentos.
3. **Recuperación:** importación validada, respaldo anterior a migraciones, conciliación de registros y restauración probada de datos y adjuntos. Separar demo, pruebas y producción.
4. **Mensajería:** identidad del remitente y destinatarios autorizados, estados de entrega, fallos y reintentos sin duplicados. No marcar una comunicación entregada solo porque se guardó el seguimiento.
5. **Operación:** dominio, despliegue y reversión documentados, responsable de incidencias y procedimiento para continuar si falla el servicio.

Prueba de salida: consulta → seguimiento entregado → respuesta → revisión, con permisos correctos, sin duplicados y con recuperación demostrada. Si el piloto incluye propietarios, comprobar que nadie accede a mascotas o documentos ajenos.

## Próxima evolución de marca blanca

Aplicar el [contrato común](../../eilvi-portafolio/MARCA_BLANCA_Y_PRODUCCION.md) mediante una configuración versionada. Conservar la distinción entre Eilvi, CercaVet y la clínica usuaria.

- IDs estables de producto, clínica y entorno, independientes del nombre comercial y de las claves históricas de almacenamiento.
- Identidad, contacto y orígenes de aplicación/web/archivos coherentes por entorno. Dominio propio y conexión de backend siguen pendientes.
- `timeZone` ya es explícito y configurable para la clínica: demos nuevas en `America/Caracas`, migraciones con la zona previa del dispositivo. Pendientes `locale`, `currency` y unidades explícitos; se mantiene el formato `es-ES`. Confirmar moneda y uso de Bs/USD con la clínica. No hay configuración de varias sedes.
- Documentos con identidad y versión conservadas al emitirlos. El resumen TXT actual se genera con la marca vigente; todavía no cumple ese requisito histórico ni admite logo.
- Mensajes nuevos con identidad vigente e historial de comunicaciones preservado. Secretos de proveedores fuera de la configuración pública.
- Segunda configuración sin heredar pacientes, usuarios o archivos de otra clínica; prueba de exportación/importación, recuperación y aislamiento real.

## Siguiente decisión

Validar con el veterinario cómo registra vacunas y próximas dosis, cómo realiza el seguimiento y si necesita varios profesionales. Confirmar su programa actual y la posibilidad de exportar datos. Con esa evidencia, ajustar la P1 entregada y decidir el siguiente incremento P2.

Las promesas de la web se rigen por el [briefing local de landing](BRIEF_LANDING.md). Actualizar esta hoja al cerrar cada incremento con código, prueba, fecha y límites observados.
