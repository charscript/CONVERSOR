#!/bin/bash

echo "========================================================"
echo "          Compilando FreePTX para macOS (.app)"
echo "========================================================"
echo ""

# Cambiar al directorio donde esta este script
cd "$(dirname "$0")"

echo "Instalando dependencias de Python si es necesario..."
python3 -m pip install pyinstaller pywebview --break-system-packages

echo "Generando icono de la aplicación (logo.icns)..."
# Crear un iconset a partir de logo.png usando sips y iconutil
mkdir -p logo.iconset
sips -z 16 16     logo.png --out logo.iconset/icon_16x16.png > /dev/null
sips -z 32 32     logo.png --out logo.iconset/icon_16x16@2x.png > /dev/null
sips -z 32 32     logo.png --out logo.iconset/icon_32x32.png > /dev/null
sips -z 64 64     logo.png --out logo.iconset/icon_32x32@2x.png > /dev/null
sips -z 128 128   logo.png --out logo.iconset/icon_128x128.png > /dev/null
sips -z 256 256   logo.png --out logo.iconset/icon_128x128@2x.png > /dev/null
sips -z 256 256   logo.png --out logo.iconset/icon_256x256.png > /dev/null
sips -z 512 512   logo.png --out logo.iconset/icon_256x256@2x.png > /dev/null
sips -z 512 512   logo.png --out logo.iconset/icon_512x512.png > /dev/null
sips -z 1024 1024 logo.png --out logo.iconset/icon_512x512@2x.png > /dev/null

iconutil -c icns logo.iconset -o logo.icns
rm -rf logo.iconset

echo "Limpiando compilaciones anteriores..."
rm -rf build dist FreePTX.spec

echo "Compilando aplicación con PyInstaller..."
# Añadir los archivos y carpetas necesarias
python3 -m PyInstaller --onedir --windowed --name "FreePTX" --icon logo.icns \
    --add-data "index.html:." \
    --add-data "styles.css:." \
    --add-data "js:js" \
    --add-data "logo.png:." \
    app.py

echo "========================================================"
echo "Proceso completado. La aplicación se encuentra en la carpeta 'dist/FreePTX.app'."
echo "========================================================"
