# FreePTX - Professional DAW Interoperability

**FreePTX** (antes conocido como "La Máquina de PETEX") es una plataforma profesional avanzada diseñada para la interoperabilidad bidireccional entre distintos DAWs (Digital Audio Workstations), como **Pro Tools** y **FL Studio**. 

Su núcleo tecnológico está impulsado por un motor inteligente de procesamiento de señales en Python que alinea stems de audio mediante correlación de fase, traduce metadatos matemáticamente y **conforma sesiones automáticamente de forma remota** utilizando el SDK de Pro Tools (PTSL / gRPC).

---

## 🚀 El Ecosistema Autónomo (v2.2.0+)

FreePTX no es solo un programa de escritorio, es un ecosistema interconectado con mantenimiento automatizado:

1. **La Aplicación Nativa (PyWebView)**: El Frontend ha evolucionado a una poderosa *Single Page Application (SPA)* construida en React, que interactúa con el sistema operativo sin bloqueos del navegador mediante una arquitectura Multiproceso Local en Python. 
2. **Web Inteligente y Distribución Cloud**: La página de descarga (Landing Page) se comunica directamente con la API de GitHub. Los usuarios siempre descargan la última versión disponible sin que el administrador tenga que editar el código de la web.
3. **CI/CD Integrado (GitHub Actions)**: La compilación de los binarios para Mac (`.app`) y Windows (`.exe`) ocurre de forma desatendida en la nube. ¡Los programadores solo escriben código!

---

## 💻 Características Principales

*   **Asistente Inteligente (Wizard)**: Interfaz React fluida que guía al usuario en la importación de sesiones.
*   **Alineación Automática**: Detección de picos, normalización y alineación por fases de Stems importados.
*   **Traducción de Metadatos**: Extrae información de archivos `.txt` de Pro Tools y `.flp` de FL Studio hacia MIDI Universal.
*   **Control Remoto de Pro Tools (PTSL)**: FreePTX se comunica con el servidor interno de Pro Tools en el puerto 31416, importando audios y ajustando paneos/volúmenes de manera totalmente desatendida.
*   **Auto-Actualizador**: El sistema verifica su propia versión e informa al usuario si hay un parche nuevo disponible.

---

## 🛠 Entorno para Desarrolladores

Ya no necesitas configurar engorrosos entornos virtuales para publicar actualizaciones. Hemos delegado el trabajo pesado a los robots.

### ¿Cómo Publicar una Nueva Versión? (CI/CD Automático)
1. Escribe tu nuevo código y realiza tu *Commit* habitual (`git commit -m "nuevas funciones"`).
2. Crea una "Etiqueta" (Tag) especificando el número de la versión. **Asegúrate de que empiece con una "v"** (ejemplo: `v2.2.0`). Puedes hacer esto desde tu terminal con `git tag v2.2.0` o desde la pestaña "History" en GitHub Desktop.
3. Envía los cambios (`git push origin main --tags`).

**¡Eso es todo!** Automáticamente, nuestros servidores en GitHub Actions iniciarán un *Workflow*. Descargarán las dependencias, compilarán el `.exe` para Windows y la aplicación `.app` para macOS, crearán el "Release" en tu repositorio y subirán los archivos. Acto seguido, la Landing Page y la App reconocerán inmediatamente la nueva actualización.

### Compilación Local Manual (Opcional)
Si deseas compilar la aplicación para realizar pruebas en tu equipo sin subirla a internet:
- **Windows**: Ejecuta `Compilar_Windows_Exe.bat`. Requerirá tener Python instalado. Se creará un entorno independiente usando PyInstaller en la carpeta `/dist/`.
- **macOS**: Ejecuta `./Compilar_Mac_App.sh`. El script automáticamente ensamblará un paquete nativo `.app` inyectando el `.icns` del logotipo corporativo.
