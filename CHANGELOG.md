## v2.2.0 <span>(Actual)</span>

**El Ecosistema Totalmente Automatizado**

Con esta versión, FreePTX trasciende de ser solo un programa de escritorio a convertirse en una plataforma interconectada. Todo el ecosistema (Software y Web) ahora se comunica y actualiza de manera 100% autónoma gracias a la nueva arquitectura de integración continua y llamadas directas a la API de GitHub.

**Sincronización Web y Actualizaciones Nativas**

La nueva Web (Landing Page) ha sido inyectada con un sistema dinámico que lee en tiempo real el último "Release". Los botones de descarga ahora extraen mágicamente los binarios recién compilados sin intervención humana, y el registro de cambios (*Changelog*) se renderiza con un analizador Markdown integrado en la propia página web, luciendo el mismo *Glassmorphism* premium del resto de la web.

Adicionalmente, hemos conectado los conductos de *feedback*: ahora puedes reportar errores directamente con un clic, generando tiquetes automáticos en nuestro panel central de GitHub.

**Integración Continua CI/CD**

Esta es la primera versión construida por robots. La compilación de los archivos para macOS y Windows ahora ocurre de forma desatendida en la nube (*GitHub Actions*). Con solo etiquetar la versión, nuestros servidores descargan dependencias, compilan ejecutables aislados y publican el parche globalmente en segundos.

## v2.1.0

**La Evolución del Diseño y Arquitectura Premium**

Esta actualización marca un antes y un después en la forma en que interactúas con FreePTX. Hemos reescrito desde cero todo el motor de renderizado visual para ofrecerte una experiencia inmersiva que compite directamente con los estándares más altos de la industria del software profesional de audio.

Hemos abandonado las interfaces planas y convencionales. Ahora, todo el ecosistema de FreePTX opera bajo una arquitectura de *Glassmorphism* (cristal esmerilado). Esto significa que las ventanas no solo bloquean el fondo, sino que lo refractan matemáticamente mediante aceleración de hardware (`backdrop-filter`), creando una sensación de profundidad y jerarquía incomparable.

**Responsividad Absoluta y Logo Dinámico**

Ya no importa si estás trabajando en un gigantesco monitor de estudio *Ultra-Wide* o ajustando sesiones en la pantalla de una laptop de 13 pulgadas. El *layout* de bienvenida fue rediseñado con flexbox dinámico y márgenes negativos inteligentes. Esto asegura que el panel interactivo y el logotipo de tu marca se re-escalen a la perfección, eliminando de raíz cualquier tipo de recorte o la necesidad de hacer *scroll* vertical molesto.

**Sistema de Bitácora Nativo Offline**

Para mantener la aplicación 100% independiente y ultrarrápida, programamos nuestro propio "traductor" de documentos integrado en el núcleo. Al acceder a este historial, FreePTX no descarga librerías pesadas de internet; su propio motor interpreta archivos Markdown estructurados en milisegundos y los dibuja en la pantalla con máxima fidelidad, garantizando disponibilidad total incluso en estudios sin conexión a la red.

## v2.0.0

**El Hito de la Interoperabilidad y "Live Sync"**

Esta versión consolida a FreePTX no solo como un conversor, sino como un puente nativo bidireccional para tu estudio. Hemos logrado una hazaña de ingeniería al integrar soporte nativo para el SDK de Scripting de Pro Tools (PTSL) a través de llamadas gRPC de altísima velocidad.

**Control Remoto de Pro Tools**

Ahora FreePTX es capaz de conformar remotamente tu DAW. Olvídate de arrastrar archivos manualmente; el sistema se comunica con el servidor interno de Pro Tools en el puerto 31416, creando sesiones, nombrando pistas, ajustando volúmenes panorámicos e importando audios de forma 100% programática y desatendida.

**Arquitectura de Puente Nativo Multiproceso**

Migramos por completo la arquitectura a un entorno multiproceso local de altísimo rendimiento impulsado por Python. La interfaz gráfica basada en WebView ahora dialoga directamente con el sistema operativo mediante un servidor RESTful local multihilo. Esto nos permite esquivar las gravísimas limitaciones y bloqueos de seguridad que imponen los navegadores tradicionales al intentar leer y escribir en tus discos duros.

## v1.5.0

**El Cerebro de Procesamiento Analítico (DSP)**

Los cimientos del procesamiento de audio inteligente fueron forjados aquí. FreePTX ya no solo mueve archivos, sino que los entiende, los analiza y toma decisiones algorítmicas por ti en tiempo real, operando en segundo plano sin interrumpir tu flujo de trabajo.

**Smart Mixer y Gain Staging Automático**

Implementamos complejos algoritmos de cálculo de potencia RMS para analizar la densidad de energía de los Stems generados. El sistema predice picos y aplica atenuaciones preventivas automáticas de ganancia en tu sesión, lo que evita por completo la temida saturación (*clipping*) en el *Master Bus* al momento de dar *play* por primera vez a un nuevo proyecto.

**Auto-Resampling y Procesamiento Multihilo**

Al detectar colisiones o discrepancias en la Frecuencia de Muestreo (*Sample Rate*), el programa levanta automáticamente un *Pool* de hilos paralelos (*Threads*). Estos procesos en segundo plano se encargan de ejecutar un remuestreo matemático de alta fidelidad para conformar todos los WAVs al estándar de la sesión, asegurando que la interfaz nunca se quede colgada ni te haga esperar.
