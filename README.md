# Desarrollo App Financiera (SPA)

Una aplicación web de una sola página (SPA) moderna y minimalista diseñada para la gestión integral de finanzas personales. El sistema permite monitorear el patrimonio neto, controlar presupuestos mensuales y gestionar activos y pasivos en tiempo real.

## 🚀 Tecnologías

- **Frontend:** [React 18](https://reactjs.org/) con [Vite](https://vitejs.dev/) como herramienta de construcción.
- **Base de Datos y Backend:** [Supabase](https://supabase.com/) para persistencia de datos y actualizaciones en tiempo real.
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) para una interfaz de usuario responsiva y "Dark Mode" nativo.
- **Iconografía:** [Lucide React](https://lucide.dev/).

## ✨ Características Principales

- **Panel de Control (Dashboard):** Visualización del flujo de caja mensual (ingresos vs gastos) y progreso del presupuesto.
- **Gestión de Cuentas:** Administración de cuentas de ahorro, efectivo y seguimiento de activos fijos.
- **Tarjetas de Crédito:** Control de deudas, límites de crédito y alertas de fechas de pago próximas.
- **Préstamos:** Seguimiento de saldos pendientes y conteo de cuotas restantes.
- **Suscripciones:** Listado de servicios recurrentes para evitar cargos inesperados.
- **Transacciones Inteligentes:** Registro de ingresos, gastos y transferencias que actualizan automáticamente los saldos de las cuentas involucradas.
- **Tiempo Real:** Integración con canales de Supabase para reflejar cambios instantáneamente.

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd finanzas
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_llave_publica_anon
    ```

4.  **Iniciar el entorno de desarrollo:**
    ```bash
    npm run dev
    ```

## 📂 Estructura del Proyecto

- `App.jsx`: Orquestador principal, manejo de estados globales y navegación.
- `Views.jsx`: Contiene las vistas modulares (Dashboard, Cuentas, Tarjetas, Préstamos, Configuración).
- `ActionModal.jsx`: Componente centralizado para la creación y edición de registros.
- `UI.jsx`: Componentes reutilizables de interfaz (Items de navegación, botones flotantes, etc.).
- `formatters.js`: Utilidades para formateo de moneda y cálculo de fechas.

## 📦 Scripts

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción en la carpeta `dist/`.
- `npm run preview`: Previsualiza localmente la compilación de producción.