# Clínica Base

Aplicación local de marca blanca para una clínica veterinaria. Implementación nueva e independiente, centrada en el recorrido **cita → consulta → seguimiento → nueva reserva**. La identidad inicial «Clínica Oliva» y todos los pacientes son ejemplos; no son una marca definitiva ni datos de una clínica real.

[Abrir demo pública](https://eduardosalomonm.github.io/clinica-base/) · [Código en GitHub](https://github.com/eduardosalomonm/clinica-base)

La demo utiliza datos ficticios y guarda los cambios únicamente en el navegador de cada visitante. No hay cuentas, servidor ni envío real de mensajes.

## Publicación

Cada actualización de `main` ejecuta las pruebas, compila y publica `dist` en GitHub Pages mediante `.github/workflows/deploy.yml`. El despliegue define `DEPLOY_BASE_PATH=/clinica-base/`; en desarrollo local la ruta sigue siendo `/`. Si cambia el nombre del repositorio, actualizar esa ruta y los enlaces de este documento. Configuración basada en la [guía oficial de Vite para GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).

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

También se pueden añadir pacientes, buscar por nombre o propietario, consultar su historial, filtrar la agenda y descargar el resumen de una consulta en texto.

## Marca blanca

**Identidad de la clínica** permite cambiar nombre, frase, profesional, teléfono, correo, logo local (PNG/JPG/WebP, hasta 300 KB) y paleta (oliva, océano, terracota). Cambia la cabecera, la identidad visual, el título del navegador, favicon y los nuevos mensajes y resúmenes. Los mensajes ya registrados conservan su contenido histórico.

La configuración inicial está en `src/seed.ts`; las paletas y el contrato de configuración en `src/domain.ts`. La marca de la clínica es la única marca visible: no hay pie de proveedor, marca de plataforma, identificadores de servicios ni analítica.

## Estructura

- `src/domain.ts`: modelo y transiciones del recorrido, validación de datos y configuración.
- `src/seed.ts`: datos ficticios, con fechas relativas al primer arranque o reinicio.
- `src/store.ts`: almacenamiento local, avisos de guardado, sincronización básica entre pestañas y exportación.
- `src/App.tsx`: navegación, ventanas y aplicación de la identidad.
- `src/workspace.tsx`: resumen del día, agenda, pacientes e historial, seguimientos.
- `src/consultation.tsx`: consulta, borrador y resumen descargable.
- `src/forms.tsx`: alta de paciente, reserva y seguimiento.
- `src/settings.tsx`: identidad y herramientas de demostración.
- `src/ui.tsx` y `src/styles.css`: componentes y diseño adaptativo.
- `tests/workflow.test.mjs`: pruebas del recorrido y de las restricciones que protegen los enlaces entre registros.

La capa de dominio recibe un estado y devuelve el nuevo estado. El almacenamiento está separado para que la futura API no obligue a reescribir las reglas del recorrido.

## Límites actuales

- Una clínica y un profesional por instalación local. No hay autenticación, roles, servidor ni aislamiento entre usuarios.
- Datos bajo `clinic.workspace.v1` en el almacenamiento del navegador. No se comparten entre dispositivos ni dominios. Borrar los datos del navegador los elimina.
- Las modificaciones se sincronizan entre pestañas del mismo origen, pero no existe resolución de conflictos de edición simultánea.
- El contacto es simulado. Copiar un mensaje no lo envía; registrar una respuesta tampoco conecta con WhatsApp o correo.
- El horario de ejemplo es de 09:00 a 20:00. No se implementan festivos, múltiples profesionales, zonas horarias por sede ni turnos.
- La revisión propuesta es una fecha orientativa, no una reserva hasta completar el formulario.
- No hay facturación, pagos, recetas, inventario, automatizaciones ni portal de propietarios en esta primera base.
- Se puede exportar JSON; la importación de copias y la migración desde otros sistemas quedan pendientes.
- Un formato de datos no reconocido se muestra como error de recuperación; no se sobrescribe automáticamente.
- No hay peticiones a servicios externos desde la aplicación. Las fuentes usan el sistema y los iconos se empaquetan localmente. El servidor de desarrollo utiliza su conexión local de recarga.
- Los paquetes estándar conservan sus propias licencias dentro de sus distribuciones. La implementación nueva no reutiliza el código ni los recursos del repositorio revisado.

## Siguiente fase

Probar este recorrido con el veterinario y observar qué necesita en cada paso. Después: autenticación real, base de datos con permisos por clínica, historial de cambios, copias restaurables y envío de mensajes con estados de entrega. El nombre comercial definitivo se puede elegir sin acoplarlo a la marca de cada clínica.

## Referencias de interacción

Patrones consultados: paneles complementarios y tablas de [shadcn/ui](https://ui.shadcn.com/docs/components). La interfaz se implementa con componentes propios, diálogos HTML y React; no se ha copiado el código de esos ejemplos.
