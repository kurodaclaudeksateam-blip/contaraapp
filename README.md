# Contador de Tubos

App web (un solo `index.html`) para contar tubos / círculos en una foto tomada con la cámara del teléfono.

## Uso
1. Abre la página en el teléfono (debe servirse por **HTTPS** para que la cámara en vivo funcione, p. ej. GitHub Pages).
2. Toca **Iniciar y abrir cámara**, encuadra los tubos de frente y toma la foto.
3. Revisa el conteo: toca un círculo para quitarlo, toca un tubo sin marcar para agregarlo. Los amarillos son dudosos.

Si el navegador no permite la cámara en vivo, **Cámara del sistema** abre la cámara nativa del teléfono.

### Modo en vivo
**Contar en vivo mientras apuntas** detecta en cada cuadro de video (a 560 px, 2–4 análisis/s) y dibuja los círculos encima de la imagen con su número.
- Cada círculo se sigue entre cuadros. Sólo se cuenta cuando aparece en al menos 3 cuadros y en la mitad del tiempo, así los falsos de un solo cuadro no suben el conteo.
- Lo que sale del encuadre se olvida a los pocos cuadros. El conteo es de lo que está en pantalla, no un acumulado de un barrido.
- **Terminar** toma la foto final, la analiza a resolución completa y muestra `En vivo: N · foto final: M` para comparar, con corrección por toque.

## Cómo detecta
- OpenCV.js 4.10 (`@techstark/opencv-js`, WebAssembly).
- Preprocesado: CLAHE + mediana + gaussiano.
- 7 métodos de candidatos: Hough gradiente (estricto, flexible, sin ecualizar) por bandas de radio, Hough ALT, contornos Otsu y umbral adaptativo en ambas polaridades.
- Consenso: agrupa candidatos y cuenta votos por método.
- Verificación: ajusta centro/radio sobre el gradiente Sobel y mide qué fracción del perímetro tiene borde real. Los círculos "invisibles" (borde o contraste insuficiente) se eliminan en automático.
- Limpieza: huecos concéntricos, círculos que abarcan varios tubos y tamaños fuera de la mediana.

La exactitud depende de la foto (luz, enfoque, tubos de frente). Ningún detector garantiza 99.9 % en toda imagen; la corrección con un toque cierra la diferencia.

## Local
```bash
python -m http.server 8777
```
