# Dashboard ESP32 Sensores

Dashboard en tiempo real para monitorear datos de sensores ESP32 conectados a PostgreSQL.

## Características

- 📊 Visualización de datos en tiempo real
- 📈 Gráficas históricas de temperatura, humedad y distancia
- 🔄 Actualización automática cada 5 segundos
- 📱 Diseño responsive
- 🌓 Soporte para modo oscuro
- 📊 Estadísticas y métricas por dispositivo

## Tecnologías

- Next.js 16 con App Router
- React 19
- TypeScript
- PostgreSQL con node-postgres (pg)
- Tailwind CSS v4
- shadcn/ui
- Recharts

## Instalación

### 1. Configurar la Base de Datos

Asegúrate de que tu tabla PostgreSQL tenga la siguiente estructura:

\`\`\`sql
CREATE TABLE lecturas_sensores (
    id_lectura UUID PRIMARY KEY,
    device_id VARCHAR(50),
    temperatura NUMERIC(5,2),
    humedad NUMERIC(5,2),
    distancia_cm NUMERIC(10,3),
    luz_porcentaje INTEGER,
    estado_luz VARCHAR(20),
    timestamp_lectura TIMESTAMP WITH TIME ZONE
);
\`\`\`

### 2. Configurar Variables de Entorno

En v0, agrega las siguientes variables de entorno en la sección **Vars** del sidebar:

\`\`\`env
DB_HOST=localhost
DB_NAME=tu_nombre_base_datos
DB_USER=tu_usuario
DB_PORT=5432
\`\`\`

**Nota:** Si tu base de datos PostgreSQL no requiere contraseña (común en desarrollo local), simplemente omite la variable `DB_PASSWORD`. El sistema funcionará sin ella.

Si necesitas contraseña, agrégala:
\`\`\`env
DB_PASSWORD=tu_password
\`\`\`

### 3. Ejecutar la Aplicación

La aplicación se ejecuta automáticamente en v0. Si estás ejecutando localmente:

\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
\`\`\`

El dashboard estará disponible en `http://localhost:3000`

## Arquitectura

La aplicación utiliza Next.js API Routes para conectarse directamente a PostgreSQL:

### API Endpoints

- `GET /api/devices` - Lista de dispositivos únicos
- `GET /api/latest/[deviceId]` - Última lectura de un dispositivo
- `GET /api/history/[deviceId]` - Historial de lecturas (últimas 50)
- `GET /api/stats/[deviceId]` - Estadísticas del dispositivo

### Estructura del Proyecto

\`\`\`
├── app/
│   ├── api/
│   │   ├── devices/route.ts           # Lista dispositivos
│   │   ├── latest/[deviceId]/route.ts # Última lectura
│   │   ├── history/[deviceId]/route.ts # Historial
│   │   └── stats/[deviceId]/route.ts   # Estadísticas
│   ├── page.tsx                        # Página principal
│   ├── layout.tsx                      # Layout de la aplicación
│   └── globals.css                     # Estilos globales
├── components/
│   ├── device-dashboard.tsx            # Dashboard por dispositivo
│   ├── sensor-chart.tsx                # Componente de gráficas
│   └── metric-card.tsx                 # Tarjetas de métricas
├── lib/
│   └── db.ts                           # Utilidad de conexión PostgreSQL
└── README.md
\`\`\`

## Uso

1. Configura las variables de entorno con tus credenciales de PostgreSQL
2. Abre el dashboard en tu navegador
3. Selecciona el dispositivo ESP32 que deseas monitorear usando las pestañas
4. Los datos se actualizarán automáticamente cada 5 segundos

## Dispositivos Soportados

El dashboard detecta automáticamente los dispositivos en la base de datos. Según tu configuración, soporta:

- `esp32_2J`
- `esp32_sensores_reales`

## Personalización

Puedes personalizar los colores y estilos editando el archivo `app/globals.css` y los componentes en la carpeta `components/`.

## Solución de Problemas

### Error de conexión a la base de datos

Si recibes un error de conexión:
1. Verifica que PostgreSQL esté ejecutándose
2. Confirma que las credenciales en las variables de entorno sean correctas
3. Asegúrate de que el nombre de la tabla sea `lecturas_sensores`
4. Si no usas contraseña, omite la variable `DB_PASSWORD`
5. Verifica que el puerto de PostgreSQL sea el correcto (por defecto 5432)

### El dashboard no muestra datos

1. Abre la consola del navegador (F12) para ver los logs de depuración
2. Verifica que haya datos en la tabla `lecturas_sensores`
3. Confirma que los `device_id` en la base de datos coincidan con los esperados
4. Revisa los logs del servidor para errores de consulta SQL

### Errores de TypeScript

Si encuentras errores de tipos con `pg`, asegúrate de que `@types/pg` esté instalado:

\`\`\`bash
npm install --save-dev @types/pg
\`\`\`
