# CercaVet

Aplicación local de marca blanca para una clínica veterinaria. Implementación nueva e independiente, centrada en el recorrido **cita → consulta → seguimiento → nueva reserva**. La identidad inicial «CercaVet» y todos los pacientes son ejemplos; no representan una clínica real. CercaVet es el nombre del producto; cada clínica puede configurar su propia identidad.

[Landing para clínicas](https://veterinaria.eilvi.com/clinicas/) · [Abrir demo pública](https://veterinaria.eilvi.com/) · [Código en GitHub](https://github.com/eduardosalomonm/cercavet)

La demo utiliza datos ficticios y guarda los cambios únicamente en el navegador de cada visitante. No hay cuentas, servidor ni envío real de mensajes.

## Publicación

Cada actualización de `main` ejecuta las pruebas, compila y publica `dist` en GitHub Pages mediante `.github/workflows/deploy.yml`. El despliegue define `DEPLOY_BASE_PATH=/`; en desarrollo local la ruta sigue siendo `/`. El dominio se configura en `public/CNAME`; los enlaces y la base deben mantenerse coherentes con ese despliegue. Configuración basada en la [guía oficial de Vite para GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).

## Arrancar

Requisitos: Node.js 22.18+ (para ejecutar los tests TypeScript con el runner nativo) y npm.

```bash
npm ci
npm run dev
```

Abrir http://127.0.0.1:5187. El puerto es fijo; si está ocupado, detener la instancia anterior. Para compilar y comprobar:

```bash
npm test
npm run build
```

## Probar el recorrido

1. Abrir una cita desde **Hoy** o **Agenda**, por ejemplo la de Milo.
2. Pulsar **Iniciar consulta**, escribir valoración e indicaciones y escoger las fechas de seguimiento y revisión. Las notas se guardan como borrador al escribir.
3. **Finalizar consulta** crea un seguimiento vinculado, conserva el registro clínico e impide finalizarlo dos veces.
4. **Ver seguimiento** permite editar el mensaje y **Registrar contacto de prueba**. No se envía nada.
5. Registrar una respuesta de ejemplo y su evolución.
6. **Reservar revisión** crea una nueva cita enlazada al seguimiento y a la consulta anterior. Se bloquean solapamientos y duplicados. Si se cancela esa cita antes de empezar, el seguimiento vuelve a quedar pendiente de nueva reserva.

El día de ejemplo tiene siete citas con dos profesionales (Dra. Alba Martín de 09:00 a 17:00 y Dr. Pablo Ruiz de 13:00 a 20:00): una atendida, dos en sala de espera (una urgencia), una ausencia y tres confirmadas, con perros, gatos y un conejo. Desde la cita se puede **Registrar llegada** o **Marcar como no acudió**; la ausencia libera el hueco y, como la cancelación, reabre el seguimiento si era su revisión.

También se pueden añadir pacientes, buscar por nombre o propietario, consultar su historial, filtrar la agenda y descargar el resumen de una consulta en texto.

## Probar vacunaciones

1. Abrir **Vacunas**: hay cuatro ejemplos con próximas dosis vencidas, para hoy, en siete días y más adelante. Si ya habías usado la demo, **Cargar ejemplos de vacunas** añade cuatro pacientes ficticios sin borrar tus datos.
2. **Registrar vacuna** guarda paciente, vacuna, lote, fecha de aplicación y próxima dosis. Puede asociarse a una consulta del mismo paciente, pero no es obligatorio.
3. **Ver seguimiento** abre el único seguimiento de esa dosis. Registrar contacto de prueba, respuesta y revisión utiliza el mismo recorrido que una consulta.
4. **Registrar próxima dosis** conserva el registro anterior y cierra su seguimiento. La nueva aplicación tiene un nuevo vencimiento y su propio seguimiento. Reservar una revisión, por sí solo, no confirma la aplicación.
5. **Corregir fechas** exige un motivo, conserva los valores anteriores y actualiza el mismo seguimiento. Los mensajes ya registrados y las citas reservadas no cambian.
6. Recargar mantiene registros, correcciones y relaciones. Los filtros separan vencidas, hoy, próximos 30 días, más adelante e histórico.

Las fechas las indica el veterinario; no se calculan pautas médicas. La zona horaria se configura en **Identidad de la clínica**. Las demos nuevas usan `America/Caracas`; la actualización de datos antiguos conserva la zona del dispositivo para mantener la interpretación anterior. «Vencimiento» se refiere a la próxima dosis, no a caducidad de existencias.

## Marca blanca

**Identidad de la clínica** permite cambiar nombre, frase, profesional, teléfono, correo, logo local (PNG/JPG/WebP, hasta 300 KB) y paleta (bosque, océano, terracota). Cambia la cabecera, la identidad visual, el título del navegador, favicon y los nuevos mensajes y resúmenes. Los mensajes ya registrados conservan su contenido histórico.

La configuración inicial está en `src/seed.ts`; las paletas y el contrato de configuración en `src/domain.ts`. La marca de la clínica es la única marca visible: no hay pie de proveedor, marca de plataforma, identificadores de servicios ni analítica.

## Identidad CercaVet

[Guía visual y descargas](https://veterinaria.eilvi.com/brand/) · [Guía de uso](docs/BRAND.md). El kit contiene siete SVG con letras convertidas a contornos, más la guía y la licencia tipográfica. `scripts/generate-brand.py` permite regenerarlos.

La identidad corporativa vive en `src/branding.ts`. La clínica conserva sus propios datos en `brand`: su logo sustituye al símbolo, y sin imagen se muestran sus iniciales cuando usa otro nombre. El favicon sigue la misma regla. Los datos y las identidades ya personalizadas se conservan.

## Estructura

- `src/domain.ts`: modelo y transiciones del recorrido, validación de datos y configuración.
- `src/vaccination-domain.ts` y `src/vaccinations.tsx`: vacunas, vencimientos, correcciones y seguimiento único por aplicación.
- `src/dates.ts`: fechas de calendario y día actual según la zona horaria de la clínica.
- `src/seed.ts`: datos ficticios, con fechas relativas al primer arranque o reinicio.
- `src/store.ts`: almacenamiento local, avisos de guardado, sincronización básica entre pestañas y exportación.
- `src/App.tsx`: navegación, ventanas y aplicación de la identidad.
- `src/workspace.tsx`: resumen del día, agenda, pacientes e historial, seguimientos.
- `src/consultation.tsx`: consulta, borrador y resumen descargable.
- `src/forms.tsx`: alta de paciente, reserva y seguimiento.
- `src/settings.tsx`: identidad y herramientas de demostración.
- `src/ui.tsx` y `src/styles.css`: componentes y diseño adaptativo.
- `tests/workflow.test.mjs`, `tests/identity.test.mjs` y `tests/vaccinations.test.mjs`: recorrido, marca, migración, fechas, duplicados, horarios por profesional, llegada/ausencia, variedad del día de ejemplo y conservación de vínculos. 26 pruebas.

La capa de dominio recibe un estado y devuelve el nuevo estado. El almacenamiento está separado para que la futura API no obligue a reescribir las reglas del recorrido.

## Límites actuales

- Una clínica por instalación local. Los profesionales son nombres con horario en `staff` (opcional; sin él, una agenda de `brand.veterinarian` de 09:00 a 20:00): no son usuarios ni tienen permisos. No hay autenticación, roles, servidor ni aislamiento entre usuarios.
- La clave histórica de almacenamiento se conserva para mantener las citas y los datos al actualizar. Datos bajo `clinic.workspace.v1` en el almacenamiento del navegador; el esquema interno v2 migra la versión anterior y añade vacunas sin insertar ejemplos en datos existentes. No se comparten entre dispositivos ni dominios. Borrar los datos del navegador los elimina.
- Las modificaciones se sincronizan entre pestañas del mismo origen, pero no existe resolución de conflictos de edición simultánea.
- El contacto es simulado. Copiar un mensaje no lo envía; registrar una respuesta tampoco conecta con WhatsApp o correo.
- Los solapamientos se comprueban por profesional y su horario. No se implementan festivos, pausas, salas o recursos compartidos, ni zonas horarias por sede. El equipo no se edita todavía desde la interfaz.
- La revisión propuesta es una fecha orientativa, no una reserva hasta completar el formulario.
- No hay facturación, pagos, recetas, inventario, automatizaciones ni portal de propietarios en esta primera base.
- Se puede exportar JSON; la importación de copias y la migración desde otros sistemas quedan pendientes.
- Un formato de datos no reconocido se muestra como error de recuperación; no se sobrescribe automáticamente.
- No hay peticiones a servicios externos desde la aplicación. Manrope se sirve localmente con su licencia OFL; Georgia usa la fuente del sistema. Los iconos se empaquetan localmente. El servidor de desarrollo utiliza su conexión local de recarga.
- Los paquetes estándar conservan sus propias licencias dentro de sus distribuciones. La implementación nueva no reutiliza el código ni los recursos del repositorio revisado.

## Siguiente fase

La [hoja de ruta y evidencia actual](docs/MEJORAS.md), revisada el 17 de octubre de 2026, recoge **P1 entregada en la demo: vacunaciones con vencimientos enlazados al seguimiento**. **P2: portal del propietario y equipo/catálogo de servicios** continúa pendiente, según el piloto. Se conserva la propuesta de cobros Bs/USD para validarla con la clínica venezolana; facturación fiscal, suscripciones SaaS y superadministración quedan aplazadas.

Probar el recorrido con el veterinario y conocer su programa actual antes de ampliar el alcance. Para producción siguen pendientes autenticación, permisos por clínica/persona, historial de cambios, respaldo/restauración y mensajería trazable. La marca CercaVet permanece separada de la identidad configurable de cada clínica.

## Referencias de interacción

Patrones consultados: paneles complementarios y tablas de [shadcn/ui](https://ui.shadcn.com/docs/components). La interfaz se implementa con componentes propios, diálogos HTML y React; no se ha copiado el código de esos ejemplos.

## Landing para clínicas

`public/clinicas/` contiene la presentación comercial con beneficios, recorrido, vista previa de marca blanca, preguntas frecuentes y acceso a la demo. Se publica en `/clinicas/`, conservando la aplicación en `/` del dominio `veterinaria.eilvi.com`. La personalización de muestra no guarda ni envía datos. La captura procede de la demo con pacientes ficticios; las integraciones y la implantación real se distinguen de lo disponible hoy. No hay formularios, testimonios ni cifras de resultados.

El [briefing de landing](docs/BRIEF_LANDING.md) distingue funciones locales, simuladas, planificadas y dependencias de activación. Los resúmenes actuales son TXT con nombre y contacto, sin PDF con logo ni identidad de emisión conservada. Las prioridades del backlog no se anuncian como disponibles hasta verificarlas.

## QA de lanzamiento

[Informe de cinco perfiles y capturas](docs/qa-launch/RESULTADOS.md), 28 de octubre de 2026. Incluye recorridos reales de navegador, móvil a 375 px con red limitada, hallazgos por frecuencia y repetición tras las correcciones. La demo incorpora información de privacidad y uso, estado de carga, protección de formularios al volver atrás y confirmación persistente de las revisiones reservadas.
