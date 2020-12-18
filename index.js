"use strict";


let sessionTickSpent = 0;


// saveload
const newGame = {
  "mass": 1e15,
  get blackholeRadius() {
    return Math.sqrt(this.mass/1e15)/2;
  },
  "totalMass": 0,
  "quark": 0,
  "totalQuark": 0,
  "bestRecord": 0,
  "tickSpent": 0,
  "energy": 0,
  // TODO: to be more extensible,
  // it would be easier to key quarkUpgrade
  // by name rather than idx
  "quarkUpgrade" : [0, 0, 0, 0, 0, 0, 0, 0],
  "toggleQuark": 0
};
var game = {...newGame};
var savePoint = "blockHoleShrinker";
function save() {
  localStorage[savePoint] = JSON.stringify(game);
}
function load() {
  if (typeof localStorage[savePoint] != "undefined") {
    game = JSON.parse(localStorage[savePoint]);
    game.quarkUpgrade.forEach((lvl, i) => {
      upgrades[i].lvl = lvl;
    });
  }
  for (const i in newGame) {
    if (typeof game[i] == "undefined") {
      gameReset();
    }
  }
}
function gameReset() {
  game = {...newGame};
  save();
}

let speedMult = 1;

const upgrades = [
  {
    name: "More Quarks",
    description: "Spawn more Quarks per click",
    baseCost: 10,
    lvl: 0,
    get upgradeCost() {
      const lvp = this.lvl + 1;
      return Math.floor(10 * lvp * (lvp ** lvp));
    },
    get effect() {
      return this.lvl;
    },
    get effectDisplayString () {
      return "+" + notation(this.effect)
    },
  },
  {
    name: "Heavier Quarks",
    description: "Spawn heavier Quarks",
    baseCost: 100,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      return Math.floor(100*(2+lv/11)**(lv/1.6));
    },
    get effect() {
      const lv = this.lvl;
      return lv**2+Math.max(0, lv-10)**3;
    },    
    get effectDisplayString () {
      return "+" + notation(this.effect)
    },
  },
  {
    name: "Fast Clicker",
    description: "Autoclick Faster",
    baseCost: 1e4,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      return Math.floor(1e4*(2+lv/8)**(lv*0.9));
    },
    get effect() {
      const lv = this.lvl;
      return 1+lv**1.5/10+lv/2;
    },
    get effectDisplayString () {
      return this.effect.toFixed(2) + " / sec"
    },
  },
  {
    name: "More Heavier Quarks",
    description: "Spawn more heavier quarks",
    baseCost: 1e5,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      return Math.floor(1e5*(1.7+lv/10)**(lv/1.2));
    },
    get effect() {
      const lv = this.lvl;
      return 1+lv*(1+lv/(10*0.93**lv));
    },
    get effectDisplayString () {
      return "x" + notation(this.effect.toFixed(2))
    },
  },
  {
    name: "Faster Quarks",
    description: "Faster move speed of Quarks",
    baseCost: 1e6,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      return Math.floor(4e5*(1+lv/13)**(lv/1.6));
    },
    get effect() {
      const lv = this.lvl;
      return 1+lv/(10*0.9**lv);
    },
    get effectDisplayString () {
      return "x" + notation(this.effect.toFixed(2))
    },
  },
  {
    name: "Critical Chance",
    description: "Increase mass! Increase speed!",
    baseCost: 1e7,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      return Math.floor(3e6*(3-lv/50)**lv);
    },
    get effect() {
      return 0.02 * this.lvl;
    },
    get effectDisplayString () {
      return (this.effect * 100).toFixed(0) + "%"
    },
  },
  {
    name: "Compress Quarks",
    description: "Compress some Quarks, but gain mass",
    baseCost: 1e8,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      // is 50e6 a typo in the original version?
      return Math.floor(50e6*(3+lv/4)**lv);
    },
    get effect() {
      const lv = this.lvl;
      return [1+lv, 1+lv*3];
    },
    get effectDisplayString () {
      return `/${this.effect[0]}, x${this.effect[1]}`
    },
  },
  {
    name: "Speed Mass",
    description: "Speed multiply affect mass",
    baseCost: 1e9,
    lvl: 0,
    get upgradeCost() {
      const lv = this.lvl;
      const lvp = lv + 1;
      return Math.floor(3e8*lvp**(4+lv));
    },
    get effect() {
      const lv = this.lvl;
      return Math.pow(speedMult * (1+lv/(10*0.9**lv)), lv/4);
    },
    get effectDisplayString () {
      return "x" + notation(this.effect.toFixed(2))
    }
  },
];

// querying/manipulating the DOM is expensive...
// rebuilding things and looking everything up 
// will murder the CPU if you do it every tick!
// so build those nodes once and hide them til you need them
// and save references to them so you don't have to look them back up.
const upgradeArea = document.getElementById("upgradeArea");
upgrades.forEach((upgrade, i) => {
  const upgradeDiv = document.createElement("div");
  upgradeDiv.classList.add("upgrade");
  upgradeArea.append(upgradeDiv);

  upgradeDiv.onclick = function buyUpgrade() {
    if (game.quark >= upgrade.upgradeCost) {
      game.quark -= upgrade.upgradeCost;
      game.quarkUpgrade[i]++;
      upgrade.lvl++;
    }
  }

  const upgradeNameDiv = document.createElement("div");
  upgradeNameDiv.textContent = upgrade.name;
  upgradeNameDiv.classList.add("upgradeName");
  upgradeDiv.append(upgradeNameDiv);

  const upgradeEffectDiv = document.createElement("div");
  upgradeEffectDiv.classList.add("upgradeEffect");
  const upgradeEffectNowSpan = document.createElement("span");
  upgradeEffectNowSpan.classList.add("upgradeEffectNow")
  upgradeEffectNowSpan.textContent = upgrade.effectDisplayString;
  upgradeEffectDiv.append(upgradeEffectNowSpan);
  const upgradeEffectNextSpan = document.createElement("span");
  upgradeEffectNextSpan.classList.add("upgradeEffectNext")
  // nasty hack
  upgrade.lvl += 1;
  upgradeEffectNextSpan.textContent = upgrade.effectDisplayString;
  upgrade.lvl -= 1;
  upgradeEffectDiv.append(upgradeEffectNextSpan);
  upgradeDiv.append(upgradeEffectDiv);

  const upgradeDescDiv = document.createElement("div");
  upgradeDescDiv.textContent = upgrade.description;
  upgradeDescDiv.classList.add("upgradeDesc");
  upgradeDiv.append(upgradeDescDiv);

  const upgradeCostDiv = document.createElement("div");
  upgradeCostDiv.textContent = upgrade.upgradeCost;
  upgradeCostDiv.classList.add("upgradeCost");
  upgradeDiv.append(upgradeCostDiv);

  upgradeDiv.style.display = "none";
});

const upgradeDivs = upgradeArea.children;
function updateUpgradeMenu() {
  upgrades.forEach((upgrade, i) => {
    const upgradeDiv = upgradeDivs[i];
    if (game.totalQuark >= upgrade.baseCost) {
      upgradeDiv.style.display = "";
    }

    
    upgradeDiv.style.filter =
      game.quark > upgrade.upgradeCost
        ? "brightness(1.7)"
        : "brightness(1)"

    const effectNowNode = upgradeDiv.children[1].children[0];
    effectNowNode.textContent = upgrade.effectDisplayString;

    const effectNextNode = upgradeDiv.children[1].children[1];
    // nasty hack
    upgrade.lvl += 1;
    effectNextNode.textContent = upgrade.effectDisplayString;
    upgrade.lvl -= 1;

    const costDiv = upgradeDiv.children[3];
    costDiv.textContent = upgrade.upgradeCost;
  })  
}


const fasterQuarks = upgrades.find(u => u.name === "Faster Quarks");
class Quark {
  constructor(attrs={}) {
    this.mass = attrs.mass || 1;
    this.speed = attrs.speed || 0;
    this.dist = attrs.dist || game.blackholeRadius;
    this.angle = attrs.angle || 0;
    this.color = attrs.color || '#fff';
  }

  update() {
    // gravitational acceleration is not affected 
    // by the mass of the object experiencing it...
    // but I only made it more realistic this way
    // to allow for the quark array to be ordered
    // by time to reach the center, without expensive sorting.
    this.speed += (0.000003)*(1.5)/Math.log(/* this.mass + 1 */ 2, 3)**2*fasterQuarks.effect;
    this.dist -= this.speed * speedMult;
    if (this.dist < 0) {
      blackholeBump(this.mass);
      quarkBump(this.mass);
    }
    // I think it looks cool if stuff spirals a little
    // but that's just my suggestion
    this.angle += 0.001 / this.dist**2;
  }
}
class Antiquark extends Quark {
  update() {
    this.speed += (0.000003)*(1.5)/Math.log(/* this.mass + 1 */ 2, 3)**2*fasterQuarks.effect;
    this.dist += this.speed * speedMult;
    this.angle += 0.001 / this.dist**2;
  }
}

// by splitting quarks and antiquarks into two separate arrays,
// it becomes very easy to delete complementary pairs.
let quarks = [];
let antiquarks = [];

function updateAndFilterParticles () {
  for (const quark of quarks) {
    quark.update();
  }
  for (const antiquark of antiquarks) {
    antiquark.update();
  }

  // Array splicing is expensive--it creates a new array.
  // So if you do that for every single quark, you're burning much CPU.
  // By slicing multiple off at once like this,
  // You only rebuild once per tick, no matter how many quarks.

  const idxNextReachingSingularity =
    Math.max(0, quarks.findIndex(q => q.dist > 0));
    
  if (idxNextReachingSingularity > 0) {
    quarks = quarks.slice(idxNextReachingSingularity);
    antiquarks = antiquarks.slice(idxNextReachingSingularity);
  }
}

const compressQuarks = upgrades.find(u => u.name === "Compress Quarks");
const critChance = upgrades.find(u => u.name === "Critical Chance");
function spawnQuark(count=1) {
  let crit;
  if (Math.random() < critChance.effect) {
    crit = 1;
    speedMult = Math.min(1e3, speedMult*100);
  } else {
    crit = 0;
  }
  const countC = Math.max(1, Math.ceil(count/compressQuarks.effect[0]));
  let mult = compressQuarks.effect[1]*((count/compressQuarks.effect[0])/countC);
  const mass = getQuarkMass();
  const dist = Math.sqrt(game.mass/1e15);
  for (var i = 0; i < countC; i++) {
    const angle = Math.PI*2*Math.random();
    if (!crit) {
      quarks.push(new Quark({dist, angle, mass: mass*mult, color: '#e1f0d8'}));
      antiquarks.push(new Antiquark({dist, angle, mass: mass*mult, color: '#e6aae5'}));
    } else {
      mult *= 2;
      quarks.push(new Quark({dist, angle, mass: mass*mult, color: '#77ed2f'}));
      antiquarks.push(new Antiquark({dist, angle, mass: mass*mult, color: '#e827e5'}));
    }
  }
}

const onscreenCanvas = document.querySelector("canvas");
const onscreenCtx = onscreenCanvas.getContext("2d", {alpha: false});

const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d", {alpha: false});

const blackholeCanvas = document.createElement("canvas");
const blackholeCtx = blackholeCanvas.getContext("2d", {alpha: false});

let canvasWidth = Math.floor( (innerWidth-innerHeight*0.005)*0.8 );
let canvasHeight = Math.floor( innerHeight*0.935 );

function resizeCanvases() {
  canvasWidth = Math.floor( (innerWidth-innerHeight*0.005)*0.8 );
  canvasHeight = Math.floor( innerHeight*0.935 );

  onscreenCanvas.width = canvasWidth;
  onscreenCanvas.height = canvasHeight;

  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;

  blackholeCanvas.width = canvasWidth;
  blackholeCanvas.height = canvasHeight;
}
resizeCanvases();
window.onresize = resizeCanvases;


// frame counter gets updated in another function
// (sorry for the spaghetti code)
let framesElapsed = 0;
function updateCanvas() {
  // clear offscreenCanvas
  offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  offscreenCtx.beginPath();
  offscreenCtx.fillStyle = "#222";
  offscreenCtx.rect(0, 0, canvasWidth, canvasHeight);
  offscreenCtx.fill();

  // drawing the blackhole is expensive
  // and it doesn't change size very fast
  // so why redraw it every frame?
  if (framesElapsed % 6 === 0) {
    // clear blackholeCanvas
    blackholeCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    blackholeCtx.beginPath();
    blackholeCtx.fillStyle = "#222";
    blackholeCtx.rect(0, 0, canvasWidth, canvasHeight);
    blackholeCtx.fill();
  
    // draw blackhole
    const blackholeRadius = Math.sqrt(game.mass/1e15)/2;
    // flooring these floats to ints 
    // to prevent expensive anti-aliasing calculations
    // when using subpixel coordinates
    // (probably not a big deal for only one object, but it's good practice)
    const floor = Math.floor
    var grd = blackholeCtx.createRadialGradient(
      floor( canvasWidth/2 ), 
      floor( canvasHeight/2 ), 
      floor( canvasHeight*blackholeRadius ), 
      floor( canvasWidth/2 ), 
      floor( canvasHeight/2 ), 
      floor( canvasHeight*blackholeRadius*1.1 )
    );
    grd.addColorStop(0, "#000");
    grd.addColorStop(0.5, "#000");
    grd.addColorStop(0.5, "#fff");
    grd.addColorStop(1, "rgba(255, 255, 255, 0)");
    blackholeCtx.fillStyle = grd;
    blackholeCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  // render blackhole to offscreenCanvas
  offscreenCtx.drawImage(blackholeCanvas, 0, 0);

  if (game.toggleQuark) {
    for (const particleList of [quarks, antiquarks]) {
      for (const particle of particleList) {
        const x = Math.cos(particle.angle) * particle.dist;
        const canvasX = Math.floor( offscreenCanvas.height*(0.5+x/2)+Math.max(0, (canvasWidth-offscreenCanvas.height)/2) );
        const y = Math.sin(particle.angle) * particle.dist;
        const canvasY = Math.floor( offscreenCanvas.height*(0.5+y/2)+Math.max(0, (canvasHeight-offscreenCanvas.height)/2) );
        offscreenCtx.beginPath();
        offscreenCtx.fillStyle = particle.color;
        offscreenCtx.strokeStyle = particle.color;
        offscreenCtx.arc(
          canvasX,
          canvasY,
          ((Math.log(particle.mass, 10)+1)**2)*offscreenCanvas.height/2000,
          0, 
          Math.PI*2
        );
        offscreenCtx.fill();
        offscreenCtx.stroke();
      }
    }
  }

  // text
  if (game.totalQuark < 10) {
    offscreenCtx.beginPath();
    offscreenCtx.font = `bold ${0.5*Math.sin(sessionTickSpent/100)+5}vh Space Mono`;
    offscreenCtx.textBaseline = 'middle';
    offscreenCtx.fillStyle = '#fff';
    var txtToWrite = `Click here to Make Quarks`;
    offscreenCtx.fillText(txtToWrite, canvasWidth/2-offscreenCtx.measureText((txtToWrite).toString()).width/2, canvasHeight/2);
  }
  if (game.mass <= 1) {
    offscreenCtx.beginPath();
    offscreenCtx.font = `bold ${0.5*Math.sin(sessionTickSpent/100)+5}vh Space Mono`;
    offscreenCtx.textBaseline = 'middle';
    offscreenCtx.fillStyle = '#cfc811';
    const txtToWrite = `You beat the game! Thanks for playing!`;
    offscreenCtx.fillText(txtToWrite, canvasWidth/2-offscreenCtx.measureText((txtToWrite).toString()).width/2, canvasHeight/2);
  }

  // finally draw to the onscreen onscreenCanvas
  onscreenCtx.drawImage(offscreenCanvas, 0, 0);
}

// equestAnimationFrame gives 
// more consistent frame rate than setInterval, 
// and allows for more separation of game logic and graphics
requestAnimationFrame( function animateFrame() {
  framesElapsed += 1;
  updateCanvas();
  updateUIexceptUpgradeMenu();
  updateUpgradeMenu();
  requestAnimationFrame(animateFrame);
})

// etc
function signRand() {
  return Math.sign(Math.random()*2-1);
}
function notation(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// save these references to avoid re-querying the DOM for them
const quarkCounter = document.getElementById("quarkCount");
const quarkToggler = document.getElementById("toggleQuark");
const blackHoleMassCounter = document.getElementById("blackholeMass");

function updateUIexceptUpgradeMenu () {
  quarkCounter.textContent = notation(Math.floor(game.quark));
  const transform = quarkCounter.style.transform;
  // the regex was cool, but I think this way is easier to read?
  const scaleFactorIdx = transform.search(/scale\(1,/);
  const offset = "scale(1,".length;
  const scaleFactor = parseFloat(transform.slice(scaleFactorIdx + offset+1)) || 1;
  quarkCounter.style.transform = `scale(1, ${Math.max(1, scaleFactor * .99)}`;
  
  blackHoleMassCounter.textContent = 'Mass: ' + notation(Math.floor(game.mass));
  
  quarkToggler.style.color =
    game.toggleQuark
      ? '#b31d92'
      : '#2eb31d'
}

const speedMass = upgrades.find(u => u.name === "Speed Mass");
function quarkBump(n) {
  game.quark += n * speedMass.effect;
  game.totalQuark += n * speedMass.effect;
  quarkCounter.style.transform = "scale(1, 1.5)";
  if (game.quark > 1e15) {
    game.quark = 1e15;
  }
}
function blackholeBump(count) {
  game.mass -= count * speedMass.effect;
  game.totalMass += count * speedMass.effect;
  if (game.mass < 1) {
    game.mass = 1;
    quarkCounter.style.color = '#cfc811';
  }
}

const heavierQuarks = upgrades.find(u => u.name === "Heavier Quarks");
const moreHeavierQuarks = upgrades.find(u => u.name === "More Heavier Quarks");
function getQuarkMassRange() {
  return [1, 1 + heavierQuarks.effect * moreHeavierQuarks.effect];
}
function getQuarkMass() {
  return Math.floor(Math.random()*(getQuarkMassRange()[1]-getQuarkMassRange()[0]+1))+getQuarkMassRange()[0];
}

const moreQuarks = upgrades.find(u => u.name === "More Quarks")
function getClickMult() {
  return 1 + moreQuarks.effect;
}

onscreenCanvas.onclick = () => spawnQuark(getClickMult());

// loop
const targetTicksPerSecond = 50;
const tickSpeed = 1000 / targetTicksPerSecond;
const fastClicker = upgrades.find(u => u.name === "Fast Clicker");
let autoClickCharge = 0;
setInterval( function () {
  updateAndFilterParticles();

  sessionTickSpent++;
  game.tickSpent++;
  if (sessionTickSpent%100 === 0) {
    save();
  }
  autoClickCharge += fastClicker.effect * tickSpeed/1000;
  if (autoClickCharge > 1) {
    spawnQuark(getClickMult()*Math.floor(autoClickCharge));
    autoClickCharge -= Math.floor(autoClickCharge);
  }
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
