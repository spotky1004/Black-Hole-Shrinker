"use strict";

// init1
var canvas = document.querySelector("#canvas");
var c = canvas.getContext("2d");
var sessionTickSpent = 0;
var quarks = [];
var canvasSize = innerHeight*0.935;
var maxCanvasPos;

// canvas
function screenUpdate() {
  // set canvas size
  canvas.width = innerWidth;
  canvas.height = innerHeight*0.935;
  canvasSize = Math.min(canvas.width, canvas.height);
  maxCanvasPos = [
    ((innerWidth-Math.max(0, (innerWidth-canvasSize)/2))/canvasSize)*2-1,
    (((innerHeight*1-innerHeight*0.065)-Math.max(0, (innerHeight*(1-0.065)-canvasSize)/2))/canvasSize)*2-1
  ];

  // clear canvas
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.beginPath();
  c.fillStyle = "#222";
  c.rect(0, 0, canvas.width, canvas.height);
  c.fill();

  var blackholeSize = Math.sqrt(game.mess/1e15)/2;
  // draw blackhole
  var grd = c.createRadialGradient(canvas.width/2, canvas.height/2, canvasSize*blackholeSize, canvas.width/2, canvas.height/2, canvasSize*blackholeSize*1.1);
  grd.addColorStop(0, "#000");
  grd.addColorStop(0.5, "#000");
  grd.addColorStop(0.5, "#fff");
  grd.addColorStop(1, "rgba(255, 255, 255, 0)");
  c.fillStyle = grd;
  c.fillRect(0, 0, canvas.width, canvas.height);

  // draw quarks
  for (var i = 0; i < quarks.length; i++) {
    if (
      (quarks[i].driction && (Math.abs(quarks[i].position[0]) > maxCanvasPos[0] || Math.abs(quarks[i].position[1]) > maxCanvasPos[1])) ||
      (!quarks[i].driction && Math.abs(quarks[i].position[0]) < 0.005 && Math.abs(quarks[i].position[1]) < 0.005)
    ) {
      if (quarks[i].driction) {
        quarkBump(1);
      } else {
        blackholeBump(1);
      }
      quarks.splice(i, 1);
      i--;
      continue;
    }
    c.beginPath();
    c.fillStyle = quarks[i].color;
    c.strokeStyle = quarks[i].color;
    quarks[i].update();
    c.arc(
      canvasSize*(0.5+quarks[i].position[0]/2)+Math.max(0, (innerWidth-canvasSize)/2),
      canvasSize*(0.5+quarks[i].position[1]/2)+Math.max(0, (innerHeight*(1-0.065)-canvasSize)/2),
      quarks[i].mess*canvasSize/2,
      0, Math.PI*2
    );
    c.fill();
    c.stroke();
  }
}

// saveload
var tempSaveData = {
  "mess": 1e15,
  "quark": 0,
  "bestRecord": 0,
  "tickSpent": 0,
  "energy": 0
};
var game = {};
var savePoint = "blockHoleShrinker";
function save() {
  localStorage[savePoint] = JSON.stringify(game);
}
function load() {
  if (typeof localStorage[savePoint] != "undefined") {
    game = JSON.parse(localStorage[savePoint]);
  }
  for (var i in tempSaveData) {
    if (typeof game[i] == "undefined") {
      game[i] = tempSaveData[i];
    }
  }
}

// calculate
function signRand() {
  return Math.sign(Math.random()*2-1);
}

// quark
class Quark {
  constructor(attrs={}) {
    this.position = attrs.position || [0, 0];
    this.mess = attrs.mess || 0;
    this.speed = attrs.speed || 0;
    this.driction = attrs.driction || 0;
    this.color = attrs.color || '#fff';
  }

  update() {
    this.speed = (this.speed/100+0.003)*(!this.driction/2+1);
    var deg = (Math.atan2(this.position[1]-0, this.position[0]-0)+Math.PI*(3/2+this.driction))%(Math.PI*2);
    this.position[0] += Math.sin(deg)*this.speed;
    this.position[1] -= Math.cos(deg)*this.speed;
  }
}

// game
function mainDomUpdate() {
  document.getElementById("quarkCount").innerHTML = game.quark;
  document.getElementById("quarkCount").style.transform = `scale(${Math.max(1, Number(document.getElementById("quarkCount").style.transform.replace(/[scale\(\)]|(1, )/g, ''))*0.99)})`;
}
function quarkBump(count) {
  game.quark += count;
  document.getElementById("quarkCount").style.transform = `scale(1.4)`;
}
function blackholeBump(count) {
  game.mess -= count;
}

// event
var mousePos = [-1, -1];
var canvasPos = [0, 0];
document.onmousemove = getMousePos;
function getMousePos(event) {
  mousePos = [event.clientX, event.clientY];
  canvasPos = [
    ((mousePos[0]-Math.max(0, (innerWidth-canvasSize)/2))/canvasSize)*2-1,
    (((mousePos[1]-innerHeight*0.065)-Math.max(0, (innerHeight*(1-0.065)-canvasSize)/2))/canvasSize)*2-1
  ];
}
canvas.onclick = new Function("var r = [Math.random()*0.4*signRand(), Math.random()*0.4*signRand()]; quarks.push(new Quark({position: [canvasPos[0]+r[0], canvasPos[1]+r[1]], mess: 0.008, color: '#0787f0'}));quarks.push(new Quark({position: [canvasPos[0]+r[0], canvasPos[1]+r[1]], mess: 0.008, driction: 1, color: '#f02a07'}));");

// loop
setInterval( function () {
  screenUpdate();
  sessionTickSpent++;
  game.tickSpent++;
  if (sessionTickSpent%100 === 0) {
    save();
  }
  mainDomUpdate();
}, 15);

// init2
load();
