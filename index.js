const video = document.getElementById('webcam');
const detectedColorBox = document.getElementById('detected-color');
const detectionLabel = document.getElementById('detection-label');
const mixedColorBox = document.getElementById('mixed-color');
const mixInfo = document.getElementById('mix-info');
const addButton = document.getElementById('add-btn');
const resetButton = document.getElementById('reset-btn');
const colorHistory = document.getElementById('color-history');

const colorMap = {
    "Rot": { color: "#FF0000", rgb: [255, 0, 0] },
    "Grün": { color: "#00FF00", rgb: [0, 255, 0] },
    "Blau": { color: "#0000FF", rgb: [0, 0, 255] },
    "Gelb": { color: "#FFFF00", rgb: [255, 255, 0] }
};

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

let model;
let currentDetection = null;
let mixedColors = [];

async function loadModel() {
    const modelURL = "https://teachablemachine.withgoogle.com/models/teNMTMV1b/";
    const modelJson = modelURL + "model.json";
    const metadataJson = modelURL + "metadata.json";
    model = await tmImage.load(modelJson, metadataJson);
    console.log("Modell geladen!");
    predictLoop();
}

async function predictLoop() {
    while (true) {
        await predict();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function predict() {
    if (!model) return;
    const prediction = await model.predict(video);
    let highestProbability = 0;
    let highestClass = null;
    prediction.forEach(p => {
        if (p.probability > highestProbability && p.probability > 0.7) {
            highestProbability = p.probability;
            highestClass = p.className;
        }
    });

    if (highestClass && colorMap[highestClass]) {
        currentDetection = highestClass;
        detectedColorBox.style.backgroundColor = colorMap[highestClass].color;
        detectedColorBox.textContent = highestClass;

        // Lesbare Textfarbe berechnen
        const rgb = colorMap[highestClass].rgb;
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]);
        detectedColorBox.style.color = luminance > 186 ? "#000" : "#fff";

        detectionLabel.textContent = `${highestClass} erkannt (${(highestProbability * 100).toFixed(1)}%)`;
        addButton.disabled = false;
    } else {
        currentDetection = null;
        detectedColorBox.style.backgroundColor = "#ccc";
        detectedColorBox.textContent = "Keine Farbe erkannt";
        detectedColorBox.style.color = "#000";
        detectionLabel.textContent = "Warte auf Erkennung...";
        addButton.disabled = true;
    }
}

function addColor() {
    if (!currentDetection || !colorMap[currentDetection]) return;
    mixedColors.push(currentDetection);
    updateMixedColor();
    updateColorHistory();
}

function updateMixedColor() {
    if (mixedColors.length === 0) {
        mixedColorBox.style.backgroundColor = "#ccc";
        mixedColorBox.textContent = "Noch keine Mischung";
        mixedColorBox.style.color = "#000";
        mixInfo.textContent = "Mische Farben durch Hinzufügen";
        return;
    }

    let totalR = 0, totalG = 0, totalB = 0;
    mixedColors.forEach(colorName => {
        const rgb = colorMap[colorName].rgb;
        totalR += rgb[0];
        totalG += rgb[1];
        totalB += rgb[2];
    });

    const avgR = Math.min(255, Math.round(totalR / mixedColors.length));
    const avgG = Math.min(255, Math.round(totalG / mixedColors.length));
    const avgB = Math.min(255, Math.round(totalB / mixedColors.length));
    const mixedColorHex = `rgb(${avgR}, ${avgG}, ${avgB})`;
    mixedColorBox.style.backgroundColor = mixedColorHex;

    // Lesbare Textfarbe setzen
    const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
    mixedColorBox.style.color = luminance > 186 ? "#000" : "#fff";

    let colorText = getMixedColorName(avgR, avgG, avgB);
    mixedColorBox.textContent = colorText;
    mixInfo.textContent = `Gemischt aus ${mixedColors.join(' + ')}`;
}

function getMixedColorName(r, g, b) {
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

    const colorNames = [
        { name: "Weiß", rgb: [255, 255, 255] },
        { name: "Schwarz", rgb: [0, 0, 0] },
        { name: "Gelb", rgb: [255, 255, 0] },
        { name: "Magenta", rgb: [255, 0, 255] },
        { name: "Cyan", rgb: [0, 255, 255] },
        { name: "Rot", rgb: [255, 0, 0] },
        { name: "Grün", rgb: [0, 255, 0] },
        { name: "Blau", rgb: [0, 0, 255] },
        { name: "Orange", rgb: [255, 165, 0] },
        { name: "Lila", rgb: [128, 0, 128] },
        { name: "Türkis", rgb: [64, 224, 208] }
    ];
    let minDist = Infinity;
    let closestName = "Unbekannt";
    colorNames.forEach(c => {
        const dist = Math.sqrt(
            Math.pow(r - c.rgb[0], 2) +
            Math.pow(g - c.rgb[1], 2) +
            Math.pow(b - c.rgb[2], 2)
        );
        if (dist < minDist) {
            minDist = dist;
            closestName = c.name;
        }
    });
    return closestName;
}

function updateColorHistory() {
    colorHistory.innerHTML = "";
    mixedColors.forEach((colorName, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.style.backgroundColor = colorMap[colorName].color;
        historyItem.title = colorName;
        historyItem.textContent = colorName;

        const rgb = colorMap[colorName].rgb;
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]);
        historyItem.style.color = luminance > 186 ? "#000" : "#fff";

        historyItem.addEventListener('click', () => {
            mixedColors.splice(index, 1);
            updateMixedColor();
            updateColorHistory();
        });
        colorHistory.appendChild(historyItem);
    });
}

function resetMix() {
    mixedColors = [];
    updateMixedColor();
    updateColorHistory();
}

addButton.addEventListener('click', addColor);
resetButton.addEventListener('click', resetMix);

async function init() {
    try {
        await setupWebcam();
        await loadModel();
    } catch (error) {
        console.error("Fehler bei der Initialisierung:", error);
        alert("Fehler beim Laden der Webcam oder des Modells. Bitte überprüfe deine Kamera-Einstellungen und versuche es erneut.");
    }
}

init();
