const video = document.getElementById('webcam');
const detectedColorBox = document.getElementById('detected-color');
const mixedColorBox = document.getElementById('mixed-color');
const addButton = document.getElementById('add-btn');
const resetButton = document.getElementById('reset-btn');

const colorMap = {
    "Rot": { color: "#FF0000", rgb: [255, 0, 0] },
    "Grün": { color: "#00FF00", rgb: [0, 255, 0] },
    "Blau": { color: "#0000FF", rgb: [0, 0, 255] },
    "Gelb": { color: "#FFFF00", rgb: [255, 255, 0] }
};

let model;
let currentDetection = null;
let mixedColors = [];

async function setupWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise(resolve => {
        video.onloadeddata = () => resolve();
    });
}

async function loadModel() {
    const modelURL = "https://teachablemachine.withgoogle.com/models/teNMTMV1b/";
    model = await tmImage.load(modelURL + "model.json", modelURL + "metadata.json");
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
    let highest = prediction.reduce((max, p) => p.probability > max.probability ? p : max, {probability:0});
    if (highest.probability > 0.7 && colorMap[highest.className]) {
        currentDetection = highest.className;
        detectedColorBox.style.backgroundColor = colorMap[highest.className].color;
        addButton.disabled = false;
    } else {
        currentDetection = null;
        detectedColorBox.style.backgroundColor = "#ccc";
        addButton.disabled = true;
    }
}

function addColor() {
    if (!currentDetection) return;
    mixedColors.push(currentDetection);
    updateMixedColor();
}

function updateMixedColor() {
    if (mixedColors.length === 0) {
        mixedColorBox.style.backgroundColor = "#ccc";
        return;
    }
    let total = mixedColors.reduce((acc, name) => {
        let rgb = colorMap[name].rgb;
        return [acc[0]+rgb[0], acc[1]+rgb[1], acc[2]+rgb[2]];
    }, [0,0,0]);
    let avg = total.map(x => Math.min(255, Math.round(x / mixedColors.length)));
    mixedColorBox.style.backgroundColor = `rgb(${avg[0]},${avg[1]},${avg[2]})`;
}

function resetMix() {
    mixedColors = [];
    updateMixedColor();
}

addButton.addEventListener('click', addColor);
resetButton.addEventListener('click', resetMix);

window.addEventListener('DOMContentLoaded', async () => {
    await setupWebcam();
    await loadModel();
});
