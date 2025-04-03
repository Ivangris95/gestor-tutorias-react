# Guía de configuración de TutoSync

Esta guía te ayudará a configurar el entorno necesario para ejecutar TutoSync, incluyendo la base de datos MySQL y las variables de entorno.

## Prerrequisitos

-   MySQL Server 8.0+ instalado y en funcionamiento
-   Cliente MySQL (línea de comandos) o una herramienta visual como MySQL Workbench o phpMyAdmin
-   Node.js 18+ y npm 9+ instalados (necesario para soportar React 19)
-   Cuentas de servicios (si planeas usar todas las funcionalidades):
    -   Stripe para procesamiento de pagos
    -   PayPal para procesamiento de pagos alternativos
    -   Zoom para videoconferencias con la SDK de Apps

**Nota sobre compatibilidad**: Este proyecto utiliza React 19 y Vite 6, que son versiones recientes que requieren Node.js moderno para funcionar correctamente.

## Configuración de la base de datos MySQL

### Opción 1: Importar desde línea de comandos

1. Abre una terminal o línea de comandos
2. Conéctate a tu servidor MySQL:
    ```bash
    mysql -u tu_usuario -p
    ```
3. Ingresa tu contraseña cuando se te solicite
4. Crea una nueva base de datos:
    ```sql
    CREATE DATABASE tutosync_db;
    USE tutosync_db;
    ```
5. Importa el archivo SQL:
    ```sql
    SOURCE ruta/a/backend/database.sql;
    ```
    (Reemplaza "ruta/a/" con la ubicación real del archivo)

### Opción 2: Usar phpMyAdmin

1. Accede a phpMyAdmin en tu navegador
2. Crea una nueva base de datos llamada "tutosync_db"
3. Selecciona la base de datos recién creada
4. Haz clic en la pestaña "Importar"
5. Selecciona el archivo "database.sql" de la carpeta "backend" de este proyecto
6. Haz clic en "Continuar" o "Importar"

### Opción 3: Usar MySQL Workbench

1. Abre MySQL Workbench y conéctate a tu servidor
2. Crea un nuevo esquema (base de datos) llamado "tutosync_db"
3. Selecciona el menú "Server" > "Data Import"
4. Elige "Import from Self-Contained File" y selecciona el archivo "database.sql"
5. Selecciona "tutosync_db" como esquema destino
6. Haz clic en "Start Import"

## Configuración de variables de entorno

Una vez configurada la base de datos, necesitas configurar las variables de entorno tanto para el backend como para el frontend:

### Backend (.env)

1. Ve a la carpeta `backend` y crea un archivo `.env` basado en el archivo `.env.example` proporcionado:

    ```
    # Database Configuration
    DB_HOST=localhost         # Tu host de MySQL/PostgreSQL
    DB_USER=tu_usuario        # Tu usuario de base de datos
    DB_PASSWORD=tu_contraseña # Tu contraseña de base de datos
    DB_NAME=tutosync_db       # Nombre de la base de datos que creaste
    DB_PORT=3306              # Puerto de MySQL (normalmente 3306)

    # Stripe Payment Gateway
    STRIPE_SECRET_KEY=        # Tu clave secreta de Stripe
    STRIPE_PUBLISHABLE_KEY=   # Tu clave publicable de Stripe

    # Server Configuration
    PORT=3000                 # Puerto para el servidor backend

    # Zoom Integration
    ZOOM_CLIENT_ID=           # Tu ID de cliente OAuth de Zoom
    ZOOM_CLIENT_SECRET=       # Tu secreto de cliente OAuth de Zoom
    ZOOM_ACCOUNT_ID=          # Tu ID de cuenta de Zoom
    ZOOM_EMAIL=               # Email asociado con tu cuenta de Zoom
    ```

### Frontend (.env)

1. Ve a la carpeta `frontend` y crea un archivo `.env` basado en el archivo `.env.example` proporcionado:

    ```
    # PayPal
    VITE_PAYPAL_CLIENT_ID=    # Tu client ID de PayPal

    # Stripe
    VITE_STRIPE_PUBLIC_KEY=   # Tu clave pública de Stripe
    ```

> **Nota**: Puedes omitir las configuraciones de servicios que no vayas a utilizar, como Stripe, PayPal o Zoom. Sin embargo, algunas funcionalidades pueden no estar disponibles.

## Obtención de claves de API

### Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Ve al [Dashboard de Stripe](https://dashboard.stripe.com/apikeys)
3. Copia la "Publishable key" para `VITE_STRIPE_PUBLIC_KEY` en el frontend
4. Copia la "Secret key" para `STRIPE_SECRET_KEY` en el backend

### PayPal

1. Crea una cuenta de desarrollador en [PayPal Developer](https://developer.paypal.com/)
2. Crea una nueva aplicación en el [Dashboard de PayPal](https://developer.paypal.com/developer/applications)
3. Copia el "Client ID" para `VITE_PAYPAL_CLIENT_ID` en el frontend

### Zoom

1. Regístrate para una cuenta de desarrollador en [Zoom Marketplace](https://marketplace.zoom.us/)
2. Crea una nueva aplicación OAuth
3. Configura las URLs de redirección y permisos
4. Copia el "Client ID" y "Client Secret" para las variables correspondientes en el backend

## Iniciar la aplicación

Una vez que hayas configurado la base de datos y las variables de entorno, puedes iniciar la aplicación:

1. Asegúrate de estar en la carpeta raíz del proyecto donde se encuentra el package.json principal
2. Instala las dependencias si aún no lo has hecho:
    ```bash
    npm install
    cd frontend && npm install
    cd ../backend && npm install
    cd ..
    ```
3. Inicia la aplicación con:
    ```bash
    npm run dev
    ```

Este comando iniciará tanto el servidor backend como el cliente frontend en una sola terminal.

## Verificación

Para verificar que todo funciona correctamente:

1. El servidor backend debería mostrar mensajes indicando que está en funcionamiento y conectado a la base de datos
2. El frontend debería abrirse automáticamente en tu navegador (normalmente en http://localhost:5173)
3. Prueba la funcionalidad del calendario usando FullCalendar
4. Verifica que las integraciones de pago estén funcionando (puedes usar [tarjetas de prueba de Stripe](https://stripe.com/docs/testing))
5. Si hay errores relacionados con la base de datos, verifica la configuración en el archivo .env del backend
6. Si hay errores relacionados con los servicios de pago o Zoom, verifica las credenciales correspondientes

### Requisitos específicos para Fullcalendar

El proyecto utiliza FullCalendar para la gestión de eventos y citas. Para verificar que funciona correctamente:

1. Navega a la sección de calendario en la aplicación
2. Intenta crear un nuevo evento
3. Verifica que la interacción (arrastrar y soltar) funciona correctamente

## Solución de problemas comunes

-   **Error de conexión a la base de datos**: Verifica que MySQL esté en funcionamiento y que las credenciales en el archivo .env sean correctas
-   **Puertos en uso**: Si recibes un error indicando que el puerto ya está en uso, cambia los puertos en los archivos .env
-   **Módulos no encontrados**: Ejecuta `npm install` en las carpetas backend, frontend y raíz
-   **Error en las API de pago**: Verifica que las claves de API de Stripe/PayPal sean correctas y estén en modo prueba para desarrollo
-   **Error de CORS**: Si recibes errores de CORS, verifica que las URLs del frontend y backend estén correctamente configuradas en los archivos de configuración
-   **Problemas con React 19**: Asegúrate de usar Node.js 18+ ya que React 19 tiene requisitos de compatibilidad más estrictos
-   **Errores con FullCalendar**: Verifica que todas las dependencias de FullCalendar estén instaladas (@fullcalendar/core, @fullcalendar/daygrid, @fullcalendar/interaction, @fullcalendar/react)
-   **Problemas con la SDK de Zoom**: Asegúrate de tener correctamente configurada la app en el Marketplace de Zoom y que las credenciales sean correctas

## Próximos pasos

Una vez que hayas configurado el entorno de desarrollo correctamente, puedes:

1. Explorar el código fuente para entender la estructura del proyecto
2. Crear tutoriales de prueba para verificar la funcionalidad
3. Probar el sistema de pagos con tarjetas de prueba de Stripe y PayPal
4. Configurar sesiones de Zoom para verificar la integración
