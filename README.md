# SportU

Sistema web para la gestión de eventos deportivos de la Universidad Autónoma del Cauca.

SportU centraliza la programación de actividades deportivas, las inscripciones, el control de asistencia, las horas deportivas, los certificados, el inventario y los préstamos.

## Funcionalidades principales

- Gestión de deportes y eventos deportivos.
- Programación por fechas, días de la semana y sesiones.
- Inscripción de estudiantes.
- Registro de asistencia por sesión.
- Cálculo de ponderado, horas acumuladas y elegibilidad para certificados.
- Generación de certificados e impresión o descarga en PDF.
- Consulta de seguimiento de eventos por parte del coordinador.
- Gestión de inventario y préstamos con filtros por estado y fecha.
- Exportación de listados de asistencia y préstamos a XLSX.
- Inicio de sesión local y acceso con Google para cuentas institucionales configuradas.

## Roles

| Rol | Funciones |
|---|---|
| Coordinador | Administra deportes, eventos, inventario, préstamos, seguimiento, horas y certificados. |
| Docente deportivo | Consulta sus actividades y registra la asistencia de los estudiantes inscritos. |
| Estudiante | Consulta eventos, se inscribe, revisa su asistencia, horas y certificados. |

## Tecnologías

- **Frontend:** React, Vite, React Router, Bootstrap y React Icons.
- **Backend:** Node.js, Express, JWT, bcrypt y Google Auth Library.
- **Base de datos:** MySQL mediante mysql2.
- **Exportaciones:** XLSX, jsPDF y html2canvas.

## Estructura del proyecto

```text
SportU/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Requisitos

- Node.js LTS y npm.
- MySQL Server.
- Git.
- Navegador actualizado: Chrome, Edge o Firefox.

## Instalación local

1. Clona el repositorio y entra en la carpeta del proyecto.
2. Crea la base de datos MySQL y ejecuta el script SQL correspondiente a la versión entregada.
3. En `backend`, copia `.env.example` como `.env` y completa las variables localmente.
4. En `frontend`, copia `.env.example` como `.env` y configura la URL de la API.
5. Instala las dependencias del backend:

   ```bash
   cd backend
   npm install
   ```

6. Instala las dependencias del frontend:

   ```bash
   cd ../frontend
   npm install
   ```

7. Inicia el backend en una terminal:

   ```bash
   cd backend
   npm run dev
   ```

8. Inicia el frontend en otra terminal:

   ```bash
   cd frontend
   npm run dev
   ```

9. Abre `http://localhost:5173/`.

## Variables de entorno

No publiques contraseñas, tokens, Client IDs ni cadenas de conexión reales. Usa los archivos `.env.example` como guía.

### Backend

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario_local
DB_PASSWORD=secreto_local
DB_NAME=sportu
JWT_SECRET=secreto_largo_local
GOOGLE_CLIENT_ID=tu_client_id_oauth
GOOGLE_ALLOWED_DOMAIN=uniautonoma.edu.co
```

### Frontend

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu_client_id_oauth
```

Para utilizar Google, el Client ID debe estar configurado en Google Cloud con los orígenes autorizados del entorno donde se ejecuta la aplicación.

## Despliegue actual

La versión publicada utiliza una arquitectura separada:

- **Frontend:** Vercel — https://sport-u-one.vercel.app/
- **Backend:** Railway — https://sportu-production.up.railway.app/
- **Base de datos:** MySQL administrado por Railway.

El frontend se construye desde la carpeta `frontend` y consume el backend mediante `VITE_API_URL`. Railway ejecuta el backend desde la carpeta `backend` y proporciona las variables de conexión a MySQL. Las variables de producción se configuran directamente en Vercel y Railway; no se almacenan en GitHub.

Para publicar una nueva versión:

1. Validar localmente el backend y ejecutar `npm run build` dentro de `frontend`.
2. Revisar que no existan archivos `.env`, contraseñas, tokens ni claves reales en los cambios.
3. Confirmar los cambios en la rama `main` de GitHub.
4. Verificar en Railway que el backend finalice correctamente el despliegue y revisar sus logs.
5. Verificar en Vercel que el frontend quede en estado `Ready`.
6. Probar el inicio de sesión, los roles, la asistencia, las horas, los certificados, los préstamos y las exportaciones desde las URLs públicas.

El endpoint de comprobación de conexión del backend es:

```text
https://sportu-production.up.railway.app/api/db-test
```

Debe responder indicando que SportU está conectado correctamente con MySQL.

## Scripts disponibles

### Backend

- `npm start`: inicia el servidor.
- `npm run dev`: inicia el servidor con Nodemon.

### Frontend

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera la compilación de producción.
- `npm run lint`: ejecuta las validaciones de ESLint.

## API

Las rutas principales se encuentran bajo `/api`:

- `/api/auth`
- `/api/deportes`
- `/api/eventos`
- `/api/inscripciones`
- `/api/inventario`
- `/api/prestamos`
- `/api/horas`
- `/api/docente`
- `/api/estudiante`
- `/api/dashboard`

Las rutas protegidas requieren un token Bearer y validan el rol del usuario.

## Pruebas y validación

Antes de entregar una versión:

1. Ejecuta `npm run build` en `frontend`.
2. Verifica el inicio de sesión y los permisos de cada rol.
3. Prueba crear un evento, inscribirse, registrar asistencia y consultar las horas.
4. Verifica filtros y exportaciones de asistencia y préstamos.
5. Confirma que no se incluyan archivos `.env`, contraseñas ni claves reales en el commit.

La asistencia se registra por sesión. Al cambiar de fecha, la pantalla carga únicamente los estados de esa sesión; el ponderado se calcula con las sesiones evaluadas y las horas acumuladas solo consideran asistencias confirmadas.

## Documentación

La documentación complementaria se entrega en:

- `Manual_Usuario_SportU.docx`
- `Manual_Tecnico_SportU.docx`

## Repositorio

Repositorio oficial: [github.com/NicolasVargas3215/SportU](https://github.com/NicolasVargas3215/SportU)

## Estado del proyecto

La aplicación cuenta con una versión funcional desplegada en Vercel, Railway y MySQL administrado. Incluye autenticación local y acceso con Google para cuentas institucionales configuradas, asistencia por sesión, cálculo de ponderado y horas, certificados descargables en PDF, filtros y exportación de préstamos.

La recuperación automática de contraseña todavía requiere una implementación adicional. Antes de una puesta en operación institucional se recomienda configurar copias de seguridad periódicas, pruebas automatizadas, auditoría de cambios y un canal formal de soporte.

## Licencia y créditos

Proyecto académico para la Universidad Autónoma del Cauca. Las dependencias de terceros conservan sus respectivas licencias, declaradas en `backend/package.json` y `frontend/package.json`.
