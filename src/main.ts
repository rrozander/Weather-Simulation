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

  drawGrid(p, grid, currentDiffusionRate);
  drawCoords(p);

  p.frameRate(currentFrameRate);
}


function drawCoords (p: p5) {
    //x and y text
    p.fill("rgb(2, 118, 5)");
    p.textSize(12)
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      p.text(`${p.mouseX}, ${p.mouseY}`, 20, 20);
    }
}


function drawGrid (p: p5, grid: Grid, diffusionRate: number) {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {

      // Diffuse Cell
      grid.diffuseCell(x, y, diffusionRate);

      // Draw Cell
      const cell = grid.getCell(x, y);
      p.noStroke();
      p.fill(cell.density * 255, 0, cell.density * 255);
      p.rect(x * cellSize, y * cellSize, cellSize, cellSize);

      // Draw Velocity Vector
      if (x % 5 === 1 && y % 5 === 1) {
        p.stroke("rgb(7, 41, 155)");
        p.line(x * cellSize, y * cellSize, (x + cell.xv) * cellSize, (y + cell.yv) * cellSize);
      }
      
    }
  }
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

