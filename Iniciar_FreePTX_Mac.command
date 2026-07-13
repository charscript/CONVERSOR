#!/bin/bash

echo "========================================================"
echo "               Iniciando FreePTX..."
echo "========================================================"
echo ""

# Cambiar al directorio donde esta este script
cd "$(dirname "$0")"

# Verificar si python3 esta instalado
if ! command -v python3 &> /dev/null
then
    echo "[ERROR] Python 3 no esta instalado."
    echo "Por favor instala Python 3 usando Homebrew (brew install python) o desde python.org"
    read -p "Presiona Enter para salir..."
    exit
fi

# Instalar dependencias
echo "Instalando dependencias (pywebview)..."
python3 -m pip install pywebview --quiet

# Iniciar aplicación
echo "[SISTEMA ACTIVO] El servidor esta corriendo en http://localhost:8000"
echo "Manten esta ventana abierta mientras usas FreePTX."
echo "Para salir, simplemente cierra esta terminal o presiona Ctrl+C."
echo ""
python3 app.py
