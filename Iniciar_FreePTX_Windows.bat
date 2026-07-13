@echo off
title FreePTX - Professional DAW Interoperability
color 0A

echo ========================================================
echo        Iniciando FreePTX...
echo ========================================================
echo.

:: 1. Verificar si Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python no esta instalado o no esta agregado al PATH.
    echo.
    echo Para usar FreePTX, por favor:
    echo 1. Descarga Python 3 desde python.org o la Microsoft Store.
    echo 2. Al instalar, ASEGURATE de marcar la casilla "Add Python to PATH".
    echo 3. Cierra esta ventana e intenta de nuevo.
    echo.
    pause
    exit /b
)

:: 2. Instalar dependencias necesarias
echo Instalando dependencias (pywebview)...
python -m pip install pywebview >nul 2>&1

:: 3. Iniciar la aplicación
echo.
echo [SISTEMA ACTIVO] El servidor esta corriendo en http://localhost:8000
echo Manten esta ventana abierta mientras usas FreePTX.
echo Para salir, simplemente cierra esta ventana.
echo.
python app.py
