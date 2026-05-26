# Psicología Aplicada Front — Angular 20 + Tailwind CSS v3

## Comandos

```bash
bun start          # ng serve — http://localhost:4200
bun run build      # ng build — produce en dist/
bun run watch      # ng build --watch --configuration development
bun run test       # ng test — Karma + Jasmine
bun run ng generate component <name>
```

Usar `bun` no `npm` (lockfile: `bun.lockb`).

## Arquitectura

- **Standalone API** — sin `NgModule`. Bootstrap via `bootstrapApplication(App, appConfig)` en `src/main.ts`.
- **Signals** — estado reactivo con `signal()`, `computed()`, `input()`, `output()`. Evitar decoradores `@Input/@Output`.
- **Enrutamiento** — `provideRouter(routes)` en `app.config.ts`. `withComponentInputBinding()` para bindear parámetros de ruta a signal inputs.
- **UI**: Tailwind CSS v3 (sin PrimeNG, sin librerías de componentes externas)
- **Paleta de colores**: primary `#025A7E` (azul petróleo), accent `#7D0147` (burdeos)
- **Notificaciones**: Servicio `ToastService` + componente `ToastContainer` propio
- **Confirmaciones**: Inline confirm (sin dependencias externas)
- **API base URL**: `http://localhost:8080/api` (configurado en cada servicio)
- **Estilo Google Calendar** en vista semanal: bloques de sesión con `border-l-2` + fondo semitransparente, nombre del paciente y horario `HH:MM - HH:MM`

## Convenciones

- **Comillas simples** en TypeScript (`.editorconfig`)
- **2 espacios** indentación
- **Prettier** inline en `package.json` con parser `angular` para `*.html`
- Nombres de archivo: `app.ts` (no `app.component.ts`) — convención Angular 20
- **ChangeDetectionStrategy.OnPush** en componentes con signals

## Testing

- `bun run test` — Karma + Jasmine
- Tests junto al componente: `*.spec.ts`
- Sin framework e2e configurado

## Build

- Builder: `@angular/build:application` (Vite/esbuild)
- PostCSS: Tailwind CSS v3 via `postcss.config.json` (JSON, no JS — requisito de `@angular/build`)
- Budgets: initial 500kB/1MB (ajustable), anyComponentStyle 4kB/8kB

## Configuración

### Tailwind CSS v3 (`postcss.config.json`)

```json
{
  "plugins": {
    "tailwindcss": {},
    "autoprefixer": {}
  }
}
```

Usar `postcss.config.json` en lugar de `postcss.config.js` porque `@angular/build` solo reconoce archivos JSON.

### Paleta de colores (`tailwind.config.js`)

```js
colors: {
  primary: {
    DEFAULT: '#025A7E',
    light: '#0279A7',
    dark: '#014B68',
  },
  accent: {
    DEFAULT: '#7D0147',
    light: '#A8025E',
    dark: '#5C0133',
  },
}
```

## Componentes

### Sessions (`src/app/sessions/`)

- **Vista semanal** estilo Google Calendar con cuadrícula de 7 días × 24h
- **Bloques de sesión** posicionados absolutamente según hora de inicio/duración
- **`sessionStyle(ws)`** — devuelve `{ top: 'Npx', height: 'Npx' }` calculado con `START_HOUR=0` y `HOUR_HEIGHT=60`
- **`sessionsByDay`** — `computed` que agrupa sesiones por `dayIndex` (Map), evita iterar todas las sesiones por cada columna
- **`patientOptions`** — `computed` memoizado para el select de pacientes en el diálogo
- **`loadWeek()`** — 7 requests paralelas (`getByDate`), acumula en array local y hace un único `set()` al final. Incluye **generation counter** (`loadGen`) para descartar respuestas obsoletas si se cambia de semana rápido
- **`toSpanishLocalISO(d)`** — formatea una fecha en `yyyy-MM-ddTHH:mm:ss` usando `Intl.DateTimeFormat` con `timeZone: 'Europe/Madrid'` (el backend usa `LocalDateTime` sin zona horaria)
- **Dialog modal** con `@if` + signals para crear/editar/eliminar sesiones
- **Loading overlay** con spinner mientras se cargan las sesiones

### Patients List (`src/app/patients/`)

- Listado con filtros por fecha de alta/baja
- Confirmación inline para baja de paciente
- Tabla responsive con `<table>` nativo

### Patient Form (`src/app/patients/`)

- Formulario con `<select>` nativo, `<input type="date">`, `<textarea>`
- Creación y edición de pacientes

### Login (`src/app/login/`)

- Formulario con inputs nativos
- Toggle de contraseña con SVG inline
- Spinner inline durante la autenticación

### Shared

- **`ToastService`** — servicio con signal interno para notificaciones toast
- **`ToastContainer`** — componente que renderiza los toasts en esquina superior derecha
- **`authInterceptor`** — añade `Authorization: Bearer <token>` y `Content-Type: application/json` a todas las requests

## Decisiones técnicas

| Decisión | Razón |
|----------|-------|
| `postcss.config.json` en vez de `.js` | `@angular/build` solo lee JSON |
| `loadWeek` con array local + un `set()` | Evita múltiples actualizaciones del signal |
| `[style]` con objeto en vez de `[style.top.px]` | El binding directo `[style.top.px]` no posicionaba correctamente; con `sessionStyle()` devolviendo `Record<string, string>` funciona |
| `Intl.DateTimeFormat` con `Europe/Madrid` | El backend usa `LocalDateTime` sin timezone; hay que enviar hora local española |
| `ChangeDetectionStrategy.OnPush` | Signals + OnPush evita detección de cambios innecesaria |
| Generation counter en `loadWeek` | Previene que respuestas lentas de requests anteriores sobrescriban datos actuales |
| `sessionsByDay` computed | Reduce complejidad de O(n·días) a O(n) en el template |
| `showNav` basado en `NavigationEnd.url` | El navbar no desaparece antes de completar la navegación al logout |
| Rutas de pacientes como `children` con `canActivate` en el padre | Evita que `path: 'patients'` (prefix) intercepte `patients/new` y `patients/:id/edit` |
| SVG inline en lugar de PrimeIcons | Elimina dependencia externa |
