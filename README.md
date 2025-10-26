# 🛰️ CubeSat Orbit — PWA Python (Pyodide)

PWA installabile (GitHub Pages) che esegue **Python nel browser** per propagare un'orbita 2D semplificata (modello a due corpi) attorno alla Terra.  
Rendering in HTML5 Canvas, animazione in tempo reale.

## ⚙️ Parametri
- Altitudine perigeo (km sopra la Terra)
- Eccentricità (0..0.9)
- Durata simulazione (minuti)
- Δt integrazione (secondi)

## 🔬 Modello
- μ = 398600.4418 km³/s², R⊕ = 6371 km
- Keplero con risoluzione numerica di E (Newton-Raphson)
- Orbita nel piano equatoriale (2D), argomento del perigeo = 0

## 🚀 Pubblicazione
1. Carica i file in una repo GitHub.
2. Attiva **Settings → Pages → Deploy from branch**.
3. Apri l'URL pubblicato. Su mobile: **Aggiungi alla schermata Home** (installabile, offline).

## 📝 Licenza
MIT © 2025 — pezzaliAPP.com
