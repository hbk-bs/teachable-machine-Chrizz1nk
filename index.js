// Elemente
const video = document.getElementById('webcam');
const detectedColorBox = document.getElementById('detected-color');
const detectionLabel = document.getElementById('detection-label');
const mixedColorBox = document.getElementById('mixed-color');
const mixInfo = document.getElementById('mix-info');
const addButton = document.getElementById('add-btn');
const resetButton = document.getElementById('reset-btn');
const colorHistory = document.getElementById('color-history');

// Farben
const colorMap = {
    "Rot": { color: "#FF0000", rgb: [255, 0, 0] },
    "Grün": { color: "#00FF00", rgb: [0, 255, 0] },
    "Blau": { color: "#0000FF", rgb: [0, 0, 255] },
    "Gelb": { color: "#FFFF00", rgb: [255, 255, 0] }
};

// Für Webcam
async function setupWebcam() {
    return new Promise((resolve, reject) => {
        const constraints = {
            video: true
        };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                video.srcObject = stream;
                video.addEventListener('loadeddata', () => {
                    resolve();
                });
            })
            .catch(error => {
                console.error("Fehler beim Zugriff auf die Webcam:", error);
                reject(error);
            });
    });
}

// Für die Farb-Erkennung
let model;
let currentDetection = null;
let mixedColors = [];

// Teachable Machine 
async function loadModel() {
    const modelURL = "https://teachablemachine.withgoogle.com/models/teNMTMV1b/";
    const modelJson = modelURL + "model.json";
    const metadataJson = modelURL + "metadata.json";
    
    model = await tmImage.load(modelJson, metadataJson);
    console.log("Modell geladen!");
    
    // Nach dem Laden des Modells mit der Vorhersage beginnen
    predictLoop();
}

// Endlos-Schleife für die ergebnisse
async function predictLoop() {
    while (true) {
        await predict();
        await new Promise(resolve => setTimeout(resolve, 100)); // Kurze Pause
    }
}

// Vorhersage mit dem Modell
async function predict() {
    if (!model) return;
    
    // Vorhersage mit dem aktuellen Bild der Webcam
    const prediction = await model.predict(video);
    
    // Höchste Wahrscheinlichkeit finden
    let highestProbability = 0;
    let highestClass = null;
    
    prediction.forEach(p => {
        if (p.probability > highestProbability && p.probability > 0.7) { // Nur erkennen, wenn die Wahrscheinlichkeit > 70%
            highestProbability = p.probability;
            highestClass = p.className;
        }
    });
    
    // Ergebnis aktualisieren
    if (highestClass && colorMap[highestClass]) {
        currentDetection = highestClass;
        detectedColorBox.style.backgroundColor = colorMap[highestClass].color;
        detectedColorBox.textContent = highestClass;
        detectionLabel.textContent = `${highestClass} erkannt (${(highestProbability * 100).toFixed(1)}%)`;
        addButton.disabled = false;
    } else {
        currentDetection = null;
        detectedColorBox.style.backgroundColor = "#ccc";
        detectedColorBox.textContent = "Keine Farbe erkannt";
        detectionLabel.textContent = "Warte auf Erkennung...";
        addButton.disabled = true;
    }
}

// Farbe zur Mischung hinzufügen
function addColor() {
    if (!currentDetection || !colorMap[currentDetection]) return;
    
    mixedColors.push(currentDetection);
    updateMixedColor();
    updateColorHistory();
}

// Gemischte Farbe aktualisieren
function updateMixedColor() {
    if (mixedColors.length === 0) {
        mixedColorBox.style.backgroundColor = "#ccc";
        mixedColorBox.textContent = "Noch keine Mischung";
        mixInfo.textContent = "Mische Farben durch Hinzufügen";
        return;
    }
    
    // RGB-Werte aller Farben addieren und dann den Durchschnitt berechnen
    let totalR = 0, totalG = 0, totalB = 0;
    
    mixedColors.forEach(colorName => {
        const rgb = colorMap[colorName].rgb;
        totalR += rgb[0];
        totalG += rgb[1];
        totalB += rgb[2];
    });
    
    // Durchschnitt berechnen
    const avgR = Math.min(255, Math.round(totalR / mixedColors.length));
    const avgG = Math.min(255, Math.round(totalG / mixedColors.length));
    const avgB = Math.min(255, Math.round(totalB / mixedColors.length));
    
    // Gemischte Farbe aktualisieren
    const mixedColorHex = `rgb(${avgR}, ${avgG}, ${avgB})`;
    mixedColorBox.style.backgroundColor = mixedColorHex;
    
    // Text für die gemischte Farbe ermitteln
    let colorText = getMixedColorName(avgR, avgG, avgB);
    mixedColorBox.textContent = colorText;
    
    // Info-Text aktualisieren
    mixInfo.textContent = `Gemischt aus ${mixedColors.join(' + ')}`;
}

// Name für die gemischte Farbe ermitteln
function getMixedColorName(r, g, b) {
    // Einfache Farbbestimmung basierend auf RGB-Werten
    if (r > 200 && g > 200 && b > 200) return "Weiß";
    if (r < 50 && g < 50 && b < 50) return "Schwarz";
    
    if (r > 200 && g > 200 && b < 100) return "Gelb";
    if (r > 200 && g < 100 && b > 200) return "Magenta";
    if (r < 100 && g > 200 && b > 200) return "Cyan";
    
    if (r > 200 && g < 100 && b < 100) return "Rot";
    if (r < 100 && g > 200 && b < 100) return "Grün";
    if (r < 100 && g < 100 && b > 200) return "Blau";
    
    if (r > 200 && g > 100 && b < 100) return "Orange";
    if (r > 100 && g < 100 && b > 100) return "Lila";
    if (r < 100 && g > 100 && b > 100) return "Türkis";
    
    return `RGB(${r},${g},${b})`;
}

// Farbverlauf aktualisieren
function updateColorHistory() {
    // Verlauf leeren
    colorHistory.innerHTML = "";
    
    // Für jede Farbe in der Mischung ein Element hinzufügen
    mixedColors.forEach((colorName, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.style.backgroundColor = colorMap[colorName].color;
        historyItem.title = colorName;
        
        // Lösch-Funktion hinzufügen
        historyItem.addEventListener('click', () => {
            mixedColors.splice(index, 1);
            updateMixedColor();
            updateColorHistory();
        });
        
        colorHistory.appendChild(historyItem);
    });
}

// Zurücksetzen der Mischung
function resetMix() {
    mixedColors = [];
    updateMixedColor();
    updateColorHistory();
}

// Event-Listener
addButton.addEventListener('click', addColor);
resetButton.addEventListener('click', resetMix);

// Seite initialisieren
async function init() {
    try {
        await setupWebcam();
        await loadModel();
    } catch (error) {
        console.error("Fehler bei der Initialisierung:", error);
        alert("Fehler beim Laden der Webcam oder des Modells. Bitte überprüfe deine Kamera-Einstellungen und versuche es erneut.");
    }
}

// Seite initialisieren, wenn das DOM geladen ist
window.addEventListener('DOMContentLoaded', init);