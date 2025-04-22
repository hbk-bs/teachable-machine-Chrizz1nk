
let video;
let label = "waiting..."; 
let confidence = 0.0;
let classifier;
let modelURL = 'https://teachablemachine.withgoogle.com/models/sw1FS2JSz/';
let emoji = "❓"; 

let canvas;

function preload() {
  classifier = ml5.imageClassifier(modelURL + 'model.json');
}

function setup() {
  canvas = createCanvas(640, 520);
  canvas.parent("sketch");
  video = createCapture(VIDEO);
  video.size(640, 520); // Ensure video size matches canvas
  video.hide();
  classifyVideo();
}

function draw() {
  background(0);
  image(video, 0, 0);

  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255);
  text(label + " " + confidence, width / 2, height - 16);

  if (label === "Daumen Hoch") {
    emoji = "👍";
  } else if (label === "Daumen Runter") {
    emoji = "👎";
  } else if (label === "nothing") {
    emoji = "😐"; 
  } else if (label === "Haus") {
    emoji = "🏠"; 
  }

  if (confidence > 0.9) {
    textSize(256);
    text(emoji, width / 2, 0.7 * height);
  }
}

function classifyVideo() {
  if (classifier && video) {
    classifier.classify(video, gotResults);
  }
}

function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  if (results && results[0]) {
    label = results[0].label;
    confidence = nf(results[0].confidence, 0, 2);
  }
  classifyVideo();
}
