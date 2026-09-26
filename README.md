# Contador de Tubos

App web (un solo `index.html`) para contar tubos / círculos en una foto tomada con la cámara del teléfono.

## App Android (APK)
La APK empaqueta esta misma app con **Capacitor 6**. Tiene las mismas funciones que la web y **OpenCV incluido**, así que no descarga nada y funciona sin internet.

- Instalación: copia `ContadorTubos-v1.0.0.apk` al teléfono, ábrelo y permite instalar apps de origen desconocido. Requiere Android 5.1+.
- Permisos: cámara (foto, en vivo, recorrido) y vibración (aviso de rastreo perdido).
- El botón "atrás" regresa al inicio y la pantalla se mantiene encendida con la cámara abierta.

### Compilar la APK
Requiere Node 18+, JDK 17 y Android SDK 34 (`ANDROID_HOME`).
```bash
npm install
npm run apk
```
El resultado queda en `android/app/build/outputs/apk/release/app-release.apk`. La firma usa `keystore/keystore.properties` (fuera del repositorio). Sin ese archivo la APK sale sin firmar. **Guarda la llave**: sin ella no se pueden publicar actualizaciones que se instalen encima.

- `npm run build`: arma `www/` (index.html + OpenCV local + fuentes).
- `python scripts/icons.py`: regenera el icono en todas las densidades.

## Versión web
En la web, OpenCV se descarga **una sola vez** del CDN y el *service worker* (`sw.js`) lo guarda junto con la app y las fuentes. Las siguientes aperturas son instantáneas y sin internet.

## Uso
1. Abre la página en el teléfono (debe servirse por **HTTPS** para que la cámara en vivo funcione, p. ej. GitHub Pages).
2. Toca **Iniciar y abrir cámara**, encuadra los tubos de frente y toma la foto.
3. Revisa el conteo: toca un círculo para quitarlo, toca un tubo sin marcar para agregarlo. Los amarillos son dudosos.

Si el navegador no permite la cámara en vivo, **Cámara del sistema** abre la cámara nativa del teléfono.

### Modo recorrido (pilas grandes, zigzag)
**Recorrido: mapear pila grande en zigzag.** Espera a que el detector esté listo, empieza arriba a la izquierda **con margen** (la orilla de la pila debe pasar por el centro de la pantalla), recorre la franja despacio, baja un poco y regresa, hasta cubrir toda la pila.
- **Rastreo de cámara** en el hilo principal (~20–30 cuadros/s): flujo óptico Lucas‑Kanade con verificación de ida y vuelta y predicción por velocidad. Esto evita confundir un tubo con su vecino en una pila periódica.
- **Detección en un Web Worker** con su propia copia de OpenCV, en paralelo. Cada tubo se ubica en un **mapa global**. Si ya existe en el mapa no se vuelve a contar; se confirma y numera al verse en 3 o más cuadros.
- **Corrección de deriva:** en cada cuadro se alinea con los tubos ya confirmados.
- Avisos en pantalla: *Rastreo OK*, *Más despacio* (no cuenta mientras vas rápido) y *Rastreo perdido* (regresa a la zona anterior; vibra). Un minimapa muestra lo ya cubierto.
- **Terminar** arma un mosaico con los cuadros clave (guardados en JPEG para pilas de más de 500 tubos) y muestra el mapa completo numerado, con corrección por toque.
- **Zona central:** lo que pasa por el centro del cuadro se confirma con 3 cuadros; lo visto sólo en la orilla pide 5.
- **Unión final sin repetir:** se funden duplicados que dejó la deriva y cada cuadro se recorta a su zona válida antes de unirlo al mosaico.
- Pruebas: pila sintética de 485 tubos → 485/485. Foto real de PVC (≈266 tubos) recorrida en 3 franjas → 260 (los faltantes quedaron en la esquina de arranque, siempre en la orilla del cuadro).

### Modo en vivo
**Contar en vivo mientras apuntas** detecta en cada cuadro de video (a 560 px, 2–4 análisis/s) y dibuja los círculos encima de la imagen con su número.
- Cada círculo se sigue entre cuadros. Sólo se cuenta cuando aparece en al menos 3 cuadros y en la mitad del tiempo, así los falsos de un solo cuadro no suben el conteo.
- Lo que sale del encuadre se olvida a los pocos cuadros. El conteo es de lo que está en pantalla, no un acumulado de un barrido.
- **Terminar** toma la foto final, la analiza a resolución completa y muestra `En vivo: N · foto final: M` para comparar, con corrección por toque.

## Herramientas
- **Borrador** (resultado, vivo y recorrido): pinta la zona que no se debe contar. En el recorrido la zona queda fija en el mapa aunque muevas la cámara. *Deshacer* revierte el último trazo.
- **Nivel de inclinación** en la cámara: muestra el ángulo contra "de frente". El giroscopio endereza la perspectiva (homografía de rotación) para que los tubos vuelvan a ser círculos del mismo tamaño. Toca el nivel para fijar el ángulo actual como referencia (pilas que no son verticales).
- **Mira central** para centrar la toma.

## Cómo detecta
- OpenCV.js 4.10 (`@techstark/opencv-js`, WebAssembly).
- Preprocesado: CLAHE + mediana + gaussiano.
- 7 métodos de candidatos: Hough gradiente (estricto, flexible, sin ecualizar) por bandas de radio, Hough ALT, contornos Otsu y umbral adaptativo en ambas polaridades.
- Consenso: agrupa candidatos y cuenta votos por método.
- Verificación: ajusta centro/radio sobre el gradiente Sobel y mide qué fracción del perímetro tiene borde real. Los círculos "invisibles" (borde o contraste insuficiente) se eliminan en automático.
- Limpieza: huecos concéntricos, círculos que abarcan varios tubos y tamaños fuera de la mediana.
- **Rejilla de la pila:** paso entre vecinos → radio real; cada círculo se centra sobre su borde; los encimados se descartan; se rellenan huecos que estén en línea entre dos tubos y con ≥4 vecinos.
- **Firma del tubo:** perfil radial de brillo (hueco → pared → borde) comparado con el de los demás tubos.
- **Pila conectada:** grupos chicos alejados (andamios, barriles, "círculos en el aire") se descartan. La verificación de bordes usa la imagen sin CLAHE para no amplificar ruido.
- **Inclinación:** giroscopio (cámara) o elipses ajustadas a los tubos (fotos de galería) → se endereza la imagen.
- **Pirámide de escalas** para círculos grandes (≈10× más rápido).
- Fotos chicas se amplían (hasta 2.5×) antes de analizar.

### Pruebas
| Imagen | Real | Resultado |
|---|---|---|
| Ejemplo sintético | 45 | 45 |
| Ejemplo inclinado ≈41° | 45 | 45 (sin corrección: 52) |
| Pila sintética grande | 485 | 485 |
| Fondo oscuro con ruido ("aire") | 45 | 45, 0 fuera de la pila (antes 1) |
| Foto real PVC, modo foto | ≈266 | 266 (1 falso en una muesca de la orilla; 2–3 tapados por hierba sin detectar) |

La exactitud depende de la foto (luz, enfoque, tubos de frente). Ningún detector garantiza 99.9 % en toda imagen; la corrección con un toque cierra la diferencia.

## Local
```bash
python -m http.server 8777
```
