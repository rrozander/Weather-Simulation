import p5 from 'p5';
import { Grid } from './grid';

const windowWidth = 2048;
const windowHeight = 1024;
const cellSize = 8;
const frameRate = 60;
const diffusionRate = 0.5;

let grid: Grid;

const sketch = (p: p5) => {
  p.setup = () => setup(p);
  p.draw = () => draw(p);
  p.mousePressed = () => addDensity(p, 0.8);
  p.mouseDragged = () => {
    addDensity(p, 0.8);
    addVelocity(p);
  };
};


function setup(p: p5) {
  p.createCanvas(windowWidth, windowHeight);

  grid = new Grid(windowWidth / cellSize, windowHeight / cellSize);

  p.frameRate(frameRate);
  addControlsListeners();
  console.log("Canvas Setup Complete");
}


function draw(p: p5) {
  p.background("rgb(62, 199, 241)");

  updateGrid(grid);
  drawGrid(p, grid);
  drawCoords(p);
}


function updateGrid(grid: Grid) {
  const timestep = 1 / frameRate;
  let gridSnapshot = grid.cells.map(cell => ({...cell}));

  grid.advect(timestep, gridSnapshot, getAdvectionStrength(), 'velocity');
  grid.project();

  gridSnapshot = grid.cells.map(cell => ({...cell}));
  grid.advect(timestep, gridSnapshot, getAdvectionStrength(), 'density');
  grid.diffuse(diffusionRate);
}

function drawCoords (p: p5) {
    //x and y text
    p.fill("rgb(2, 118, 5)");
    p.textSize(12)
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      p.text(`${p.mouseX}, ${p.mouseY}`, 20, 20);
    }
}


function drawGrid (p: p5, grid: Grid) {

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      // Draw Cell
      const cell = grid.getCell(x, y);

      p.noStroke();
      p.fill(cell.density * 255, 0, cell.density * 255);
      
      const xPos = x * cellSize;
      const yPos = y * cellSize;
      p.rect(xPos, yPos, cellSize, cellSize);
    }
  }

  if (shouldVisualizeVectors()) {
    visualizeVectors(p, grid, 4);
  }
}


function visualizeVectors(p: p5, grid: Grid, spacing: number) {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      // Draw Velocity Vector
      const vectorScaling = 8;
      if (x % spacing === 1 && y % spacing === 1) {
        const cell = grid.getCell(x, y);
        const xPosition = x * cellSize;
        const yPosition = y * cellSize;
        const velocityX = cell.xv * vectorScaling;
        const velocityY = cell.yv * vectorScaling;

        if (cell.xv > 0.001 || cell.yv > 0.001 || cell.xv < -0.001 || cell.yv < -0.001) {
          drawArrow(p, xPosition, yPosition, velocityX, velocityY, 'red');
        }
      }     
    }
  }
}

function drawArrow(
  p: p5,
  baseX: number,
  baseY: number,
  vectorX: number, // How much to move in the x direction
  vectorY: number, // How much to move in the y direction
  color: string
) {
  let baseVec = p.createVector(baseX, baseY);
  let headVec = p.createVector(vectorX, vectorY);

  p.push();
  p.stroke(color);
  p.strokeWeight(2);
  p.fill(color);

  p.translate(baseVec.x, baseVec.y);
  p.line(0, 0, headVec.x, headVec.y);
  p.rotate(headVec.heading());
  let arrowSize = 3;
  p.translate(headVec.mag() - arrowSize, 0);
  p.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);

  p.pop();
}


function addDensity (p: p5, amount: number) {
  const cx = Math.floor(p.mouseX / cellSize);
  const cy = Math.floor(p.mouseY / cellSize);

  const r = getBrushRadius();
  const sigma2 = (r * r) / 2;

  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const w = Math.exp(-(dx * dx + dy * dy) / sigma2);

      const cell = grid.getCell(x, y);
      cell.density = Math.min(cell.density + amount * w, 1);
    }
  }
}

function addVelocity (p: p5) {
  const dxPx = p.mouseX - p.pmouseX;
  const dyPx = p.mouseY - p.pmouseY;

  // convert to cells/sec (approx); use actual timestep if you have it
  const dt = 1 / frameRate;

  const vx = (dxPx / cellSize) / dt;
  const vy = (dyPx / cellSize) / dt;

  // tuneables
  const strength = 0.08;        // smaller than you think
  const maxVel = 50;            // clamp injected velocity magnitude (cells/sec)

  // clamp injected magnitude
  const mag = Math.hypot(vx, vy);
  const s = mag > maxVel ? (maxVel / mag) : 1;
  const ivx = vx * s;
  const ivy = vy * s;

  const cx = Math.floor(p.mouseX / cellSize);
  const cy = Math.floor(p.mouseY / cellSize);

  // “splat” into neighborhood with Gaussian falloff
  const r = getBrushRadius();
  const sigma2 = (r * r) / 2;

  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const w = Math.exp(-(dx * dx + dy * dy) / sigma2);

      const cell = grid.getCell(x, y);
      cell.xv += ivx * strength * w;
      cell.yv += ivy * strength * w;
    }
  }
}


function getAdvectionStrength(): number {
  const slider = document.getElementById('advection-strength') as HTMLInputElement;

  return parseFloat(slider.value);
}

function getBrushRadius(): number {
  const slider = document.getElementById('brush-radius') as HTMLInputElement;

  return parseFloat(slider.value);
}

function shouldVisualizeVectors(): boolean {
  const checkbox = document.getElementById('visualize-vectors') as HTMLInputElement;

  return checkbox.checked;
}

function addControlsListeners() {
  document.getElementById('advection-strength')?.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('advection-value')!.textContent = value;
  });

  document.getElementById('brush-radius')?.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('brush-radius-value')!.textContent = value;
  });
}


new p5(sketch);

