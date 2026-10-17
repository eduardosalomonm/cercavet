# CercaVet · Identidad visual

## Idea

Cerca, en cada cuidado. Una herramienta para que la relación entre la clínica y la familia continúe después de la consulta.

El símbolo es una C abierta que acompaña a un punto. La C representa el cuidado; el punto, al paciente. La apertura representa el siguiente encuentro. Es una composición vectorial propia, diseñada para conservar su forma en un favicon y funcionar sin el nombre.

## Sistema

- Bosque — `#234B42`: logotipo, texto destacado y acciones principales.
- Salvia — `#D6E6B7`: acentos sobre fondo oscuro, detalles y áreas suaves. No usar como texto sobre blanco.
- Hoja — `#6A815B`: punto del símbolo sobre fondo claro. Uso gráfico, no texto pequeño.
- Marfil — `#F7F7F0`: fondo.
- Tinta — `#26332C`: lectura principal.
- Texto secundario — `#59655C`: etiquetas y ayuda.

Manrope, pesos 400–700, es la tipografía principal. Se distribuye localmente bajo SIL Open Font License; se incluye la licencia. Georgia se conserva solo para frases editoriales breves. No usar mayúsculas en párrafos ni reducir el cuerpo por debajo de 14 px en contenido principal.

## Logo

Los SVG del kit tienen el nombre convertido a contornos: no requieren instalar una fuente. Incluye versiones principal, inversa, monocroma, símbolos sueltos e icono de aplicación. La versión inversa requiere fondo oscuro; sus archivos tienen fondo transparente.

Dejar como mínimo el diámetro del punto de margen alrededor del logo. Tamaño mínimo recomendado: 120 px para la firma completa; 24 px para el símbolo aislado; 16 px para el favicon con fondo. No deformar, inclinar, añadir sombras, cambiar la proporción del símbolo ni recolorear la marca corporativa con la paleta de una clínica.

## Dos identidades independientes

**Producto:** CercaVet tiene su propia marca en materiales comerciales y en esta guía.

**Clínica:** el espacio de trabajo muestra el nombre, logo, colores y mensajes de la clínica. Si no hay logo, una clínica personalizada usa sus iniciales. Si se añade un logo, sustituye al símbolo. No se añade un pie «powered by» ni se mezcla CercaVet dentro del logo de la clínica. El enlace al kit vive en configuración, fuera de los documentos para propietarios.

La demo inicial usa CercaVet. Al personalizarla, cambian navegación, favicon, vista previa y nuevos mensajes/resúmenes. Los contactos ya registrados conservan su texto histórico.

## Voz

Cercana, serena y concreta. Hablar de pacientes, familias, visitas y cuidados. Orientar con verbos: «Reservar revisión», «Registrar respuesta», «Guardar identidad». Evitar lenguaje comercial dentro del flujo clínico y promesas de resultados de salud.

## Recursos y regeneración

- Guía visual: `/brand/`.
- Descarga: `/brand/cercavet-brand-kit.zip`.
- Fuente local: `public/fonts/manrope-latin.woff2`; licencia en la misma carpeta.
- `scripts/generate-brand.py` regenera los SVG con contornos y el ZIP. Requiere Python, fonttools y brotli. Usa exclusivamente la fuente local.
- El arco del símbolo se mantiene en `src/branding.ts` y en el generador; deben coincidir.

Referencias: [Manrope en Google Fonts](https://github.com/google/fonts/tree/main/ofl/manrope), para tipografía y licencia; [Avatar de shadcn/ui](https://ui.shadcn.com/docs/components/base/avatar), como referencia del patrón imagen/iniciales. No se incorpora código del componente ni una marca externa.
