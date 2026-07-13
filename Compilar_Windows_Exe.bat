@echo off
title Compilador FreePTX (Desarrolladores)
color 0E

echo ========================================================
echo        Compilando FreePTX a Ejecutable Windows
echo ========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python no esta instalado.
    pause
    exit /b
)

echo Instalando PyInstaller y pywebview si no existen...
python -m pip install pyinstaller pywebview

echo.
echo Compilando aplicacion (esto puede tardar unos segundos)...
:: "--noconsole" oculta la terminal de fondo al correr el exe
:: "--add-data" incluye los archivos web estaticos dentro del ejecutable
pyinstaller --noconfirm --onedir --noconsole --name "FreePTX" --add-data "index.html;." --add-data "styles.css;." --add-data "js;js" --add-data "logo.png;." app.py

echo.
echo ========================================================
echo ¡Compilacion terminada!
echo Tu aplicacion autocontenida esta en la carpeta:
echo .\dist\FreePTX\
echo ========================================================
pause
