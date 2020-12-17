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
  canvas.width = (innerWidth-innerHeight*0.005)*0.8;
  canvas.height = innerHeight*0.935;
  canvasSize = Math.min(canvas.width, canvas.height);
  maxCanvasPos = [
    ((canvas.width-Math.max(0, (canvas.width-canvasSize)/2))/canvasSize)*2-1,
    (((canvas.height)-Math.max(0, (canvas.height-canvasSize)/2))/canvasSize)*2-1
  ];

  // clear canvas
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.beginPath();
  c.fillStyle = "#222";
  c.rect(0, 0, canvas.width, canvas.height);
  c.fill();

  var blackholeSize = Math.sqrt(game.mass/1e15)/2;
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
      (!quarks[i].driction && Math.abs(quarks[i].position[0]) < 0.02 && Math.abs(quarks[i].position[1]) < 0.02)
    ) {
      if (quarks[i].driction) {
        quarkBump(quarks[i].mass);
      } else {
        blackholeBump(quarks[i].mass);
      }
      quarks.splice(i, 1);
      i--;
      continue;
    }
    quarks[i].update();
    if (i < 3000) {
      c.beginPath();
      c.fillStyle = quarks[i].color;
      c.strokeStyle = quarks[i].color;
      c.arc(
        canvasSize*(0.5+quarks[i].position[0]/2)+Math.max(0, (canvas.width-canvasSize)/2),
        canvasSize*(0.5+quarks[i].position[1]/2)+Math.max(0, (canvas.height-canvasSize)/2),
        ((Math.log(quarks[i].mass, 10)+1)**2)*canvasSize/2000,
        0, Math.PI*2
      );
      c.fill();
      c.stroke();
    }
  }
}

// saveload
var tempSaveData = {
  "mass": 1e15,
  "totalMass": 0,
  "quark": 0,
  "totalQuark": 0,
  "bestRecord": 0,
  "tickSpent": 0,
  "energy": 0,
  "quarkUpgrade" : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
function gameReset() {
  for (var i in tempSaveData) {
    game[i] = tempSaveData[i];
  }
  save();
}

// etc
function signRand() {
  return Math.sign(Math.random()*2-1);
}
function notation(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// quark
var speedMult = 1;
class Quark {
  constructor(attrs={}) {
    this.position = attrs.position || [0, 0];
    this.mass = attrs.mass || 0;
    this.speed = attrs.speed || 0;
    this.driction = attrs.driction || 0;
    this.color = attrs.color || '#fff';
  }

  update() {
    this.speed += (0.000003)*(1.5)/Math.log(this.mass+1, 3)**2*getUpgradeEffect(4);
    var deg = (Math.atan2(this.position[1]-0, this.position[0]-0)+Math.PI*(3/2+this.driction))%(Math.PI*2);
    this.position[0] += Math.sin(deg)*this.speed*speedMult;
    this.position[1] -= Math.cos(deg)*this.speed*speedMult;
  }
}

// game
var upgradeCut = [10, 100, 1e4, 1e5, 1e6, 1e7, 1e8, 1e10];
var upgradeName = [
  "More Quarks", "Heavier Quark", "Fast Clicler", "More Heavier Quarks", "Fasrer Quarks",
  "Critical Chance", "Compress Quarks", "What"
];
var upgradeDesc = [
  "Spawn more Quarks per clcik", "Spawn heavier Quarks", "Autoclick Faster", "Spawn more heavier Quarks", "Faster move speed of Quarks",
  "Increase mass! Increase speed!", "Compress some Quarks, but gain mass", ":v"
];
function mainDomUpdate() {
  document.getElementById("quarkCount").innerHTML = notation(game.quark);
  document.getElementById("quarkCount").style.transform = `scale(1, ${Math.max(1, Number(document.getElementById("quarkCount").style.transform.replace(/[scale\(\)]|(1, )/g, ''))*0.99)})`;
}
function upgradeSpawn() {
  var unlocked = upgradeCut.length;
  for (var i = 0, l = upgradeCut.length; i < l; i++) {
    if (upgradeCut[i] > game.totalQuark) {
      unlocked = i;
      break;
    }
  }
  while (document.querySelectorAll("#upgradeArea > .upgrade").length < unlocked) {
    var parentNode = document.getElementById("upgradeArea");
    var childNode = document.createElement("div");
    childNode.classList.add("upgrade");
    parentNode.append(childNode);

    var upgIdx = document.querySelectorAll("#upgradeArea > .upgrade").length-1;

    childNode.onclick = new Function(`buyUpgrade(${upgIdx})`);

    var parentNode = document.querySelector(`#upgradeArea > .upgrade:nth-child(${upgIdx+1})`);
    var childNode = document.createElement("div");
    childNode.innerHTML = upgradeName[upgIdx];
    childNode.classList.add("upgradeName");
    parentNode.append(childNode);

    var parentNode = document.querySelector(`#upgradeArea > .upgrade:nth-child(${upgIdx+1})`);
    var childNode = document.createElement("div");
    childNode.classList.add("upgradeEffect");
    parentNode.append(childNode);

    var parentNode = document.querySelector(`#upgradeArea > .upgrade:nth-child(${upgIdx+1}) > .upgradeEffect`);
    var childNode = document.createElement("span");
    childNode.classList.add("upgradeEffectNow");
    parentNode.append(childNode);

    var parentNode = document.querySelector(`#upgradeArea > .upgrade:nth-child(${upgIdx+1}) > .upgradeEffect`);
    var childNode = document.createElement("span");
    childNode.classList.add("upgradeEffectNext");
    parentNode.append(childNode);

    var parentNode = document.querySelector(`#upgradeArea > .upgrade:nth-child(${upgIdx+1})`);
    var childNode = document.createElement("div");
    childNode.innerHTML = upgradeDesc[upgIdx];
    childNode.classList.add("upgradeDesc");
    parentNode.append(childNode);

    var parentNode = document.querySelector(`#upgradeArea > .upgrade:nth-child(${upgIdx+1})`);
    var childNode = document.createElement("div");
    childNode.classList.add("upgradeCost");
    parentNode.append(childNode);
  }
}
function displayUpgrade() {
  upgradeSpawn();
  for (var i = 0, l = document.querySelectorAll("#upgradeArea > .upgrade").length; i < l; i++) {
    document.querySelector(`#upgradeArea > .upgrade:nth-child(${i+1}) > .upgradeCost`).innerHTML = `${notation(getUpgradeCost(i))} Quarks`;
    if (game.quark >= getUpgradeCost(i)) {
      document.querySelector(`#upgradeArea > .upgrade:nth-child(${i+1}) > .upgradeCost`).style.filter = `brightness(1.7)`;
    } else {
      document.querySelector(`#upgradeArea > .upgrade:nth-child(${i+1}) > .upgradeCost`).style.filter = `brightness(1)`;
    }
    document.querySelector(`#upgradeArea > .upgrade:nth-child(${i+1}) > .upgradeEffect > .upgradeEffectNow`).innerHTML = getUpgradeEffectString(i);
    document.querySelector(`#upgradeArea > .upgrade:nth-child(${i+1}) > .upgradeEffect > .upgradeEffectNext`).innerHTML = getUpgradeEffectString(i, game.quarkUpgrade[i]+1);
  }
}
function quarkBump(count) {
  game.quark += count;
  game.totalQuark += count;
  document.getElementById("quarkCount").style.transform = `scale(1, 1.5)`;
}
function blackholeBump(count) {
  game.mass -= count;
  game.totalMass += count;
}
function spawnQuark(count=1) {
  if (Math.random() < getUpgradeEffect(5)) {
    var crit = 1;
    speedMult = 100;
  } else {
    var crit = 0;
  }
  for (var i = 0; i < count; i++) {
    var mass = getQuarkMass();
    var dist = Math.random();
    var deg = Math.PI*2*Math.random()
    var p = [
      Math.sin(deg)*dist,
      -Math.cos(deg)*dist
    ];
    if (!crit) {
      quarks.push(new Quark({position: [p[0], p[1]], mass: mass, color: '#e1f0d8'}));
      quarks.push(new Quark({position: [p[0], p[1]], mass: mass, driction: 1, color: '#e6aae5'}));
    } else {
      var mult = 2**(Math.random()*6);
      quarks.push(new Quark({position: [p[0], p[1]], mass: mass, color: '#77ed2f'}));
      quarks.push(new Quark({position: [p[0], p[1]], mass: mass, driction: 1, color: '#e827e5'}));
    }
  }
}
function buyUpgrade(idx) {
  if (game.quark >= getUpgradeCost(idx)) {
    game.quark -= getUpgradeCost(idx);
    game.quarkUpgrade[idx]++;
    displayUpgrade();
  }
}

// get
function getQuarkMassRange() {
  var range = [1, (1+getUpgradeEffect(1))*getUpgradeEffect(3)];
  return range;
}
function getQuarkMass() {
  return Math.floor(Math.random()*(getQuarkMassRange()[1]-getQuarkMassRange()[0]+1))+getQuarkMassRange()[0];
}
function getClickMult() {
  return 1+getUpgradeEffect(0);
}
function getUpgradeCost(idx, lv=game.quarkUpgrade[idx]) {
  var lvp = lv+1;
  switch (idx) {
    case 0:
    return Math.floor(10*(lvp**lvp)*lvp);
      break;
    case 1:
    return Math.floor(100*(2+lv/11)**(lv/1.6));
      break;
    case 2:
    return Math.floor(1e4*(2+lv/8)**(lv*0.9));
      break;
    case 3:
    return Math.floor(1e5*(1.7+lv/10)**(lv/1.2));
      break;
    case 4:
    return Math.floor(4e5*(1+lv/13)**(lv/1.6));
      break;
    case 5:
    return Math.floor(3e6*(3-lv/50)**lv);
      break;
    default:
      return 9.99e99;
  }
}
function getUpgradeEffect(idx, lv=game.quarkUpgrade[idx]) {
  switch (idx) {
    case 0:
    return lv;
      break;
    case 1:
    return lv**2+Math.max(0, lv-10)**3;
      break;
    case 2:
    return 1+lv**1.5/10+lv/2;
      break;
    case 3:
    return 1+lv*(1+lv/10);
      break;
    case 4:
    return 1+lv/(10*0.9**lv);
      break;
    case 5:
    return 0.02*lv;
      break;
    default:
      return 0;
  }
}
function getUpgradeEffectString(idx, lv=game.quarkUpgrade[idx]) {
  var s = getUpgradeEffect(idx, lv).toString();
  switch (idx) {
    case 0: case 1:
    return `+${notation(s)}`;
      break;
    case 2:
    return `${Number(s).toFixed(2)} / sec`;
      break;
    case 3: case 4:
    return `x${Number(s).toFixed(2)}`;
      break;
    case 5:
    return `${(Number(s)*100).toFixed(0)}%`;
      break;
    default:
    return 'Error!';
  }
}

// event
var mousePos = [-1, -1];
var canvasPos = [0, 0];
document.onmousemove = getMousePos;
function getMousePos(event) {
  mousePos = [event.clientX, event.clientY];
  canvasPos = [
    ((mousePos[0]-Math.max(0, (canvas.width-canvasSize)/2))/canvasSize)*2-1,
    (((mousePos[1]-innerHeight*0.065)-Math.max(0, (canvas.height-canvasSize)/2))/canvasSize)*2-1
  ];
}
canvas.onclick = new Function("spawnQuark(getClickMult())");

// loop
var tickSpeed = 20;
var autoClickCharge = 0;
setInterval( function () {
  screenUpdate();
  displayUpgrade();
  sessionTickSpent++;
  game.tickSpent++;
  if (sessionTickSpent%100 === 0) {
    save();
  }
  autoClickCharge += getUpgradeEffect(2)*tickSpeed/1000;
  if (autoClickCharge > 1) {
    spawnQuark(getClickMult()*Math.floor(autoClickCharge));
    autoClickCharge -= Math.floor(autoClickCharge);
  }
  mainDomUpdate();
  speedMult = Math.max(1, speedMult/1.5)
}, tickSpeed);

// init2
load();

// override
Math.log = (function() {
  var log = Math.log;
  return function(n, base) {
    return log(n)/(base ? log(base) : 1);
  };
})();
