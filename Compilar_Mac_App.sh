#!/bin/bash

echo "========================================================"
echo "          Compilando FreePTX para macOS (.app)"
echo "========================================================"
echo ""

# Cambiar al directorio donde esta este script
cd "$(dirname "$0")"

echo "Instalando dependencias de Python si es necesario..."
python3 -m pip install pyinstaller pywebview --break-system-packages

echo "Generando icono de la aplicación (icon.icns)..."
# Crear un iconset a partir de icon.png usando sips y iconutil
mkdir -p icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png > /dev/null
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png > /dev/null
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png > /dev/null
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png > /dev/null
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png > /dev/null
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png > /dev/null
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png > /dev/null
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png > /dev/null
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png > /dev/null
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png > /dev/null

iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset

echo "Limpiando compilaciones anteriores..."
rm -rf build dist FreePTX.spec

echo "Compilando aplicación con PyInstaller..."
# Añadir los archivos y carpetas necesarias
python3 -m PyInstaller --onedir --windowed --name "FreePTX" --icon icon.icns \
    --add-data "index.html:." \
    --add-data "styles.css:." \
    --add-data "js:js" \
    --add-data "icon.png:." \
    app.py

echo "========================================================"
echo "Proceso completado. La aplicación se encuentra en la carpeta 'dist/FreePTX.app'."
echo "========================================================"
