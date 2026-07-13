# FreePTX - Professional DAW Interoperability

**FreePTX** (antes conocido como "La Máquina de PETEX") es una herramienta profesional avanzada que permite la interoperabilidad de sesiones de audio entre distintos DAWs (Digital Audio Workstations), como **Pro Tools** y **FL Studio**. Su núcleo tecnológico está impulsado por un motor inteligente que alinea stems de audio mediante análisis de picos y correlación de fase, importando marcadores, tempo y firmas rítmicas de forma automática.

## Características Principales

*   **Asistente Inteligente (Wizard)**: Interfaz fluida, paso a paso, para guiar a los usuarios en la importación de sesiones.
*   **Alineación Automática**: Detección de picos, normalización y alineación por fases de los Stems importados.
*   **Traducción de Metadatos**: Extrae y traduce información de archivos de sesión (Pro Tools `.txt` y FL Studio `.flp`) a archivos MIDI universales listos para arrastrar y soltar.
*   **Conversión Continua**: Resampling de audio inteligente y automático.
*   **Flujo Experto**: Para usuarios avanzados, todos los paneles están expuestos en una vista Dashboard unificada y un mezclador de pre-escucha.

---

## 🚀 Uso Inmediato (Para Usuarios Finales)

Para ejecutar FreePTX, no necesitas tocar código. Hemos preparado ejecutables rápidos según tu sistema operativo.

**Requisito previo:** Debes tener [Python 3](https://www.python.org/downloads/) instalado en tu equipo. *(¡Recuerda marcar "Add Python to PATH" durante la instalación!)*

### En Windows
1. Descarga el repositorio o haz un clon (`git clone`).
2. Dale doble clic al archivo `Iniciar_FreePTX_Windows.bat`.
3. ¡Listo! Se abrirá automáticamente la aplicación web en tu navegador predeterminado.

### En Mac / Linux
1. Abre tu terminal.
2. Dale permisos de ejecución al launcher: `chmod +x Iniciar_FreePTX_Mac.command`
3. Ejecútalo dando doble clic, o ejecutando `./Iniciar_FreePTX_Mac.command` en la consola.

---

## 🛠 Compilación para Producción (Para Desarrolladores)

Si deseas empaquetar FreePTX en un único ejecutable (**.exe**) totalmente independiente, de modo que el cliente final no requiera instalar Python, utiliza nuestro script de compilación incluido.

### Compilar a `.exe` (Windows)
1. Dale doble clic a `Compilar_Windows_Exe.bat`.
2. El script automáticamente instalará **PyInstaller**, y agrupará el servidor local, el analizador de archivos `.py` y todos los recursos del frontend (`.html`, `.css`, `.js`) de manera oculta.
3. El resultado final lo encontrarás dentro de la carpeta `dist/FreePTX/FreePTX.exe`. 
4. Simplemente comprime ese `.exe` en un `.zip` y distribúyelo a tus clientes o publícalo en la pestaña de **Releases** de GitHub. ¡Es totalmente autocontenido!

### ¿Cómo funciona la arquitectura?
FreePTX es extremadamente robusto e independiente. No depende de grandes frameworks web como Node.js, React o bases de datos complejas. 
- **Frontend**: Usa Vanilla HTML5, CSS3, y JavaScript moderno para renderizar una interfaz de usuario extremadamente fluida (glassmorphism).
- **Backend / Motor**: Utiliza un módulo `http.server` nativo de Python para exponer las herramientas del core (`daw_sync.py`), las cuales procesan los archivos `wav` internamente usando librerías estándar. 

*Gracias a esto, compilarlo con PyInstaller genera un artefacto rápido, eficiente y súper fácil de portar.*
