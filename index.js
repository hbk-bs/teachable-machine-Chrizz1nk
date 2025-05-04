const URL = "https://teachablemachine.withgoogle.com/models/teNMTMV1b/";
let model, webcam, labelContainer, maxPredictions;
let colorStack = [];

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(200, 200, true);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    prediction.sort((a, b) => b.probability - a.probability);
    labelContainer.innerHTML = `Erkannt: ${prediction[0].className}`;
    currentColor = prediction[0].className;
}

let currentColor = "";

document.getElementById("addColorBtn").addEventListener("click", () => {
    if (currentColor) {
        colorStack.push(currentColor);
        updateColorStack();
    }
});

document.getElementById("resetBtn").addEventListener("click", () => {
    colorStack = [];
    updateColorStack();
    document.getElementById("resultColor").textContent = "Gemischte Farbe erscheint hier";
    document.getElementById("resultColor").style.backgroundColor = "";
});

function updateColorStack() {
    document.getElementById("colorStack").textContent = `Farben: ${colorStack.join(" + ")}`;
}

document.getElementById("mixBtn").addEventListener("click", () => {
    const result = mixColors(colorStack);
    document.getElementById("resultColor").textContent = `Gemischte Farbe: ${result.name}`;
    document.getElementById("resultColor").style.backgroundColor = result.css;
});

function mixColors(colors) {
    const colorMap = {
        "Rot": [255, 0, 0],
        "Blau": [0, 0, 255],
        "Gelb": [255, 255, 0],
        "Grün": [0, 128, 0],
        "Schwarz": [0, 0, 0],
        "Weiß": [255, 255, 255]
    };

    if (colors.length === 0) return { name: "Keine Farbe", css: "transparent" };

    let r = 0, g = 0, b = 0;
    let valid = 0;

    colors.forEach(color => {
        if (colorMap[color]) {
            r += colorMap[color][0];
            g += colorMap[color][1];
            b += colorMap[color][2];
            valid++;
        }
    });

    if (valid === 0) return { name: "Unbekannt", css: "gray" };

    r = Math.round(r / valid);
    g = Math.round(g / valid);
    b = Math.round(b / valid);

    return {
        name: `rgb(${r}, ${g}, ${b})`,
        css: `rgb(${r}, ${g}, ${b})`
    };
}

init();
