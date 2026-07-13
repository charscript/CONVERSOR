# FreePTX - Professional DAW Interoperability

**FreePTX** (antes conocido como "La Máquina de PETEX") es una plataforma profesional de nivel corporativo diseñada para la interoperabilidad bidireccional entre distintos DAWs (Digital Audio Workstations), especializada en el flujo entre **Pro Tools** y **FL Studio**. 

Su núcleo tecnológico está impulsado por un motor inteligente de procesamiento digital de señales (DSP) en Python que alinea stems de audio mediante correlación de fase, traduce metadatos matemáticamente y **conforma sesiones automáticamente de forma remota** utilizando el SDK de Pro Tools (PTSL / gRPC).

---

## 🚀 El Ecosistema Autónomo (v2.3.0+)

FreePTX no es solo un programa de escritorio, es un ecosistema interconectado con mantenimiento 100% automatizado:

1. **La Aplicación Nativa (PyWebView & React)**: El *Frontend* ha evolucionado a una poderosa *Single Page Application (SPA)* construida en React, que interactúa con el sistema operativo sin bloqueos del navegador gracias a una arquitectura Multiproceso Local en Python. Toda la interfaz gráfica opera bajo el paradigma de diseño *Glassmorphism* (Cristal Esmerilado) para una experiencia premium.
2. **Web Inteligente y Distribución Cloud**: La página de descarga (Landing Page) se aloja de forma independiente y se comunica directamente con la API de GitHub. Los usuarios siempre descargan la última versión disponible, y las notas de versión (*Changelog*) se renderizan dinámicamente haciendo "bypass" directamente hacia el código fuente.
3. **CI/CD Integrado (GitHub Actions)**: La compilación de los binarios para Mac (`.app`) y Windows (`.exe`) ocurre de forma desatendida en la nube. Al publicar una nueva versión, el robot empaqueta la aplicación, extrae el registro de cambios y publica el "Release" globalmente en menos de 3 minutos.

---

## 🎧 El Motor de Procesamiento (DSP) y Funciones

*   **Asistente Inteligente (Smart Wizard)**: Interfaz fluida paso a paso que elimina la fricción de exportar e importar sesiones complejas, guiando al usuario sin necesidad de tutoriales.
*   **Alineación Automática y Fase**: Motor de detección de picos y normalización que asegura una alineación perfecta de fases en los stems importados, ahorrando horas de edición manual.
*   **Traducción de Metadatos Universal**: Extracción inteligente de marcadores de sesión, tempo, firmas de tiempo y anotaciones desde archivos de texto de Pro Tools o proyectos nativos (`.flp`) de FL Studio, convirtiéndolos en marcadores MIDI universales.
*   **Control Remoto de Pro Tools (PTSL)**: Mediante llamadas gRPC ultrarrápidas, FreePTX se comunica con el servidor interno de Pro Tools en el puerto 31416. El programa puede crear sesiones, importar audios, y ajustar paneos y volúmenes de manera totalmente desatendida.
*   **Smart Mixer y Gain Staging Automático**: Algoritmos de cálculo RMS predicen y evitan el temido *clipping* del *Master Bus*, aplicando atenuación preventiva inteligente antes de que presiones *Play* en tu DAW destino.
*   **Auto-Remuestreo Multihilo (Resampling)**: FreePTX detecta discrepancias en la Frecuencia de Muestreo (Sample Rate) y utiliza un *pool* de múltiples hilos en segundo plano para remuestrear matemática y transparentemente todos los archivos de audio al estándar del nuevo proyecto.
*   **Lector Markdown Offline**: Un motor nativo escrito desde cero permite leer y renderizar la bitácora de actualizaciones y documentos técnicos sin necesidad de librerías de internet.
*   **Auto-Actualizador Integrado**: El sistema verifica su propia versión en cada inicio y notifica visualmente al usuario si hay un parche crítico disponible.

---

## 🛠 Entorno para Desarrolladores

Ya no necesitas configurar engorrosos entornos virtuales para publicar actualizaciones. Hemos delegado el trabajo pesado a los robots.

### ¿Cómo Publicar una Nueva Versión? (CI/CD Automático)
1. Escribe tu nuevo código y realiza tu *Commit* habitual (`git commit -m "nuevas funciones"`).
2. Crea una "Etiqueta" (Tag) especificando el número de la versión. **Asegúrate de que empiece con una "v"** (ejemplo: `v2.3.0`). Puedes hacer esto desde tu terminal con `git tag v2.3.0` o desde la pestaña "History" en GitHub Desktop.
3. Envía los cambios (`git push origin main --tags`).

**¡Eso es todo!** Automáticamente, nuestros servidores en GitHub Actions iniciarán un *Workflow*. Descargarán las dependencias, compilarán el `.exe` para Windows y la aplicación `.app` para macOS, y crearán el "Release" en tu repositorio. Acto seguido, la Landing Page y la App reconocerán inmediatamente la nueva actualización.

### Compilación Local Manual (Opcional)
Si deseas compilar la aplicación para realizar pruebas en tu equipo sin subirla a internet:
- **Windows**: Ejecuta el archivo `.bat` (si existe). Requerirá tener Python instalado. Se creará un entorno independiente usando PyInstaller en la carpeta `dist/`.
- **macOS**: Ejecuta el script `.sh` correspondiente. El sistema automáticamente ensamblará un paquete nativo `.app` inyectando el `.icns` del logotipo corporativo.
