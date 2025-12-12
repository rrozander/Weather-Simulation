import p5 from 'p5';
import { Cell, Grid } from './grid';

const windowWidth = 800;
const windowHeight = 600;
const frameRate = 10;
const cellSize = 10;

let grid: Grid;

const sketch = (p: p5) => {
  p.setup = () => setup(p);
  p.draw = () => draw(p);
  p.mousePressed = () => mousePressed(p);
};


function setup(p: p5) {
  p.createCanvas(windowWidth, windowHeight);
  grid = new Grid(windowWidth / cellSize, windowHeight / cellSize);

  p.frameRate(frameRate);
  console.log("Canvas created");
}


function draw(p: p5) {
  p.background("rgb(62, 199, 241)");

  drawGrid(p, grid);
  drawCoords(p);
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

      const cell = grid.getCell(x, y);
      p.fill(cell.density * 255);
      p.rect(x * cellSize, y * cellSize, cellSize, cellSize);

      //grid.diffuseCell(x, y);
    }
  }
}


function mousePressed (p: p5) {
  const cellX = Math.floor(p.mouseX / cellSize);
  const cellY = Math.floor(p.mouseY / cellSize);
  const cell = grid.getCell(cellX, cellY);
  cell.density = Math.min(cell.density + 0.1, 1);
}


new p5(sketch);

