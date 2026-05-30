# Psicología Aplicada — Frontend

Aplicación web para la gestión de sesiones y pacientes de un centro de psicología.
Desarrollada con **Angular 20.1** (Standalone API), **Tailwind CSS v3** y **TypeScript**.

## Stack

| Capa            | Tecnología                                      |
| --------------- | ----------------------------------------------- |
| Framework       | Angular 20.1 (Standalone Components, Signals)   |
| Estilos         | Tailwind CSS v3 + PostCSS                       |
| Detección       | Zoneless (`provideZonelessChangeDetection`)     |
| Estado          | Signals (`signal()`, `computed()`)              |
| Enrutamiento    | Lazy loading con `PreloadAllModules`            |
| Build           | `@angular/build` (Vite/esbuild)                 |
| Tests           | Karma + Jasmine                                 |
| Gestor paquetes | **bun** (lockfile: `bun.lock`)                  |

## Requisitos

- [Bun](https://bun.sh/) >= 1.2
- Backend Java corriendo en `http://localhost:8080`

## Comandos

```bash
bun start          # ng serve — http://localhost:4200
bun run build      # ng build — produce en dist/
bun run watch      # ng build --watch --configuration development
bun run test       # ng test — Karma + Jasmine
```

## Funcionalidades

### 1. Autenticación (`/login`)

- Login con email y contraseña.
- El token JWT se almacena en `localStorage` y se envía automáticamente en cada petición vía `authInterceptor`.
- Protección de rutas con `authGuard` — redirige a `/login` si no hay token.
- Registro de nuevos usuarios (ADMIN / PSYCHOLOGIST) — solo ADMIN.
- Cierre de sesión que llama a `POST /api/auth/logout` para invalidar el token en backend, luego limpia el estado local y redirige al login.
- El role del usuario se extrae del JWT y se almacena en `userRole` signal (sin prefijo `ROLE_`).

### 2. Gestión de Pacientes (`/patients`)

- Listado paginado de pacientes con filtros por rango de fechas (alta/baja).
- Búsqueda automática al cambiar las fechas.
- Creación de nuevo paciente con datos personales (nombre, apellidos, fecha nacimiento, teléfono, género, observaciones).
- **Edición de paciente existente**: carga los datos del paciente (`GET /api/patients/{id}`) y las observaciones previas, que se muestran en una lista antes del textarea de nueva observación.
- La columna "Obs." en el listado muestra la **última observación truncada** a 60 caracteres con `...` (con `title` para ver el texto completo al hover), en lugar del contador numérico.
- Baja (discharge) de paciente con confirmación inline.

### 3. Gestión de Sesiones (`/sessions`)

- **Vista semanal** estilo Google Calendar con cuadrícula de 7 días × 24h.
- Cada columna representa un día de la semana; cada fila una hora.
- Las sesiones existentes se muestran como bloques posicionados absolutamente según hora de inicio y duración.
- **Creación por click**: haz clic en una hora vacía → se abre el diálogo con una sesión de 1h.
- **Creación por arrastre**: haz clic y arrastra verticalmente sobre las horas → se abre el diálogo con el rango seleccionado.
- **Edición**: haz clic en un bloque de sesión → se abre el diálogo para modificar paciente, horario, observaciones.
- **Eliminación**: desde el diálogo de edición, con confirmación previa.
- Calendario inline en el sidebar para navegar entre semanas.
- Botón "Hoy" para volver a la semana actual.
- Las sesiones se cargan con 7 peticiones paralelas (una por día) y un contador de generación para descartar respuestas obsoletas.

### 4. Gestión de Usuarios (`/users`) — solo ADMIN

- Listado de todos los usuarios con tabla responsive: email, usuario, nombre, apellido, rol, estado, fecha de creación.
- **Creación** de usuario: formulario con email, username, nombre, apellido, rol (ADMIN/PSYCHOLOGIST). La contraseña se auto-genera en el backend y se envía por email.
- **Edición** de usuario: mismos campos + toggle de estado (activo/inactivo). Carga los datos del usuario por ID.
- **Eliminación** con confirmación inline.
- **Restablecer contraseña**: botón que genera una nueva contraseña aleatoria de 12 caracteres y la envía por email al usuario.
- Protegido con `adminGuard` (solo ADMIN) y enlace en navbar visible únicamente para ADMIN.

### 5. Sistema de Notificaciones

- `ToastService` + `ToastContainer` para mostrar notificaciones toast en esquina superior derecha.
- Mensajes de éxito/error al guardar, eliminar o realizar operaciones.

## API Endpoints

El frontend se conecta a un backend Java en `http://localhost:8080/api`.

### Autenticación

| Método | Ruta                    | Descripción                           |
| ------ | ----------------------- | ------------------------------------- |
| POST   | `/api/auth/login`       | Iniciar sesión → devuelve JWT         |
| POST   | `/api/auth/register`    | Registrar nuevo usuario (solo ADMIN)  |
| POST   | `/api/auth/logout`      | Invalidar token (incrementa versión)  |

### Pacientes

| Método | Ruta                             | Descripción                              |
| ------ | -------------------------------- | ---------------------------------------- |
| GET    | `/api/observations/patients`     | Lista pacientes activos (paginado, filtro por fechas) |
| POST   | `/api/patients`                  | Crear nuevo paciente                     |
| PUT    | `/api/patients/{id}`             | Actualizar paciente                      |
| GET    | `/api/patients/{id}`             | Obtener paciente por ID (con observaciones) |
| POST   | `/api/patients/{id}/discharge`   | Dar de baja un paciente                  |

### Sesiones

| Método | Ruta                    | Descripción                              |
| ------ | ----------------------- | ---------------------------------------- |
| GET    | `/api/session`          | Obtener sesiones por fecha (`?date=YYYY-MM-DD`) |
| POST   | `/api/session`          | Crear nueva sesión                       |
| PUT    | `/api/session/{id}`     | Actualizar sesión                        |
| DELETE | `/api/session/{id}`     | Eliminar sesión                          |

### Usuarios

| Método | Ruta                             | Descripción                              |
| ------ | -------------------------------- | ---------------------------------------- |
| GET    | `/api/users`                     | Listar todos los usuarios (solo ADMIN)   |
| GET    | `/api/users/{id}`                | Obtener usuario por ID (solo ADMIN)      |
| PUT    | `/api/users/{id}`                | Actualizar usuario (solo ADMIN)          |
| DELETE | `/api/users/{id}`                | Eliminar usuario (solo ADMIN)            |
| POST   | `/api/users/{id}/reset-password` | Restablecer contraseña (solo ADMIN)      |

## Estructura del proyecto

```
src/
├── app/
│   ├── auth/
│   │   ├── auth.guard.ts           # Guard de autenticación (canActivate)
│   │   ├── admin.guard.ts          # Guard de rol ADMIN (canActivate)
│   │   ├── auth.interceptor.ts     # Interceptor HTTP: añade token JWT
│   │   ├── auth.service.ts         # Servicio de autenticación (signals)
│   │   └── login/
│   │       └── login.ts            # Componente de login
│   ├── models/
│   │   ├── auth.ts                 # Interfaces de autenticación
│   │   ├── patient.ts              # Interfaces de paciente
│   │   ├── user.ts                 # Interfaces de usuario
│   │   └── session.ts              # Interfaces de sesión
│   ├── patients/
│   │   ├── patients.service.ts     # Servicio de pacientes
│   │   ├── patients-list/          # Listado de pacientes
│   │   └── patient-form/           # Formulario de alta/edición
│   ├── users/
│   │   ├── users.service.ts        # Servicio de usuarios
│   │   ├── users-list/             # Listado de usuarios (solo ADMIN)
│   │   └── user-form/              # Formulario de alta/edición
│   ├── sessions/
│   │   ├── sessions.service.ts     # Servicio de sesiones
│   │   └── sessions.ts             # Vista semanal con drag
│   ├── shared/
│   │   ├── toast.service.ts        # Servicio de notificaciones
│   │   └── toast-container.ts      # Componente de toasts
│   ├── app.config.ts               # Configuración de la app (providers)
│   ├── app.routes.ts               # Definición de rutas (lazy loading)
│   └── app.ts                      # Componente raíz
├── index.html
├── angular.json
├── tailwind.config.js              # Paleta de colores personalizada
├── postcss.config.json             # PostCSS + Tailwind
├── package.json
└── tsconfig.json
```

## Convenciones de código

- **Standalone API**: sin `NgModule`, bootstrap directo desde `main.ts`.
- **Signals**: estado reactivo con `signal()`, `computed()`, `input()`, `output()`. Sin decoradores `@Input`/`@Output`.
- **OnPush**: `ChangeDetectionStrategy.OnPush` en todos los componentes.
- **Comillas simples** en TypeScript, indentación de 2 espacios.
- **Paleta**:
  - `primary`: `#025A7E` (azul petróleo)
  - `accent`: `#7D0147` (burdeos)
- Sin librerías de componentes externas (PrimeNG, etc.). UI con Tailwind puro.

## Licencia

Uso interno.
