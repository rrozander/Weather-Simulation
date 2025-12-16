import p5 from 'p5';
import { Grid } from './grid';

const windowWidth = 1200;
const windowHeight = 800;
const cellSize = 10;

let grid: Grid;

const sketch = (p: p5) => {
  p.setup = () => setup(p);
  p.draw = () => draw(p);
  p.mousePressed = () => addDensity(p);
  p.mouseDragged = () => addDensity(p);
};


function setup(p: p5) {
  p.createCanvas(windowWidth, windowHeight);

  grid = new Grid(windowWidth / cellSize, windowHeight / cellSize);

  p.frameRate(getFrameRate());
  addControlsListeners();
  console.log("Canvas Setup Complete");
}


function draw(p: p5) {

  const currentDiffusionRate = getDiffusionRate();
  const currentFrameRate = getFrameRate();
  p.background("rgb(62, 199, 241)");

  updateGrid(grid, currentDiffusionRate, currentFrameRate);
  drawGrid(p, grid);
  drawCoords(p);

  p.frameRate(currentFrameRate);
}


function updateGrid(grid: Grid, diffusionRate: number, frameRate: number) {
  const gridSnapshot = grid.cells.map(cell => ({...cell}));
  const timestep = 1 / frameRate;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      // Diffuse Cell
      grid.diffuseCell(x, y, diffusionRate);

      // Advect Cell
      grid.advectCell(x, y, timestep, gridSnapshot);
    }
  }
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
      p.rect(x * cellSize, y * cellSize, cellSize, cellSize);

      // Draw Velocity Vector
      if (x % 5 === 2 && y % 5 === 2) {
        const XPosition = x * cellSize;
        const YPosition = y * cellSize;
        const VelocityX = cell.xv * cellSize;
        const VelocityY = cell.yv * cellSize;

        if (cell.xv !== 0 || cell.yv !== 0) {
          drawArrow(p, XPosition, YPosition, VelocityX, VelocityY, 'red');
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


function addDensity (p: p5) {
  const cellX = Math.floor(p.mouseX / cellSize);
  const cellY = Math.floor(p.mouseY / cellSize);
  const cell = grid.getCell(cellX, cellY);
  cell.density = Math.min(cell.density + 1, 1);
}


function getDiffusionRate(): number {
  const slider = document.getElementById('diffusion-rate') as HTMLInputElement;

  return parseFloat(slider.value);
}

function getFrameRate(): number {
  const slider = document.getElementById('frame-rate') as HTMLInputElement;
  return parseInt(slider.value);
}

function addControlsListeners() {
  document.getElementById('diffusion-rate')?.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('diffusion-value')!.textContent = value;
  });

  document.getElementById('frame-rate')?.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('framerate-value')!.textContent = value;
  });
}


new p5(sketch);

