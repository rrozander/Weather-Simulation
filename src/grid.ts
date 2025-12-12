export interface Cell {
  density: number;
  xv: number; // X velocity
  yv: number; // Y velocity
}

const diffusionRate = 0.8;

export class Grid {
  height: number;
  width: number;
  cells: Cell[];

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
    this.cells = Array.from({ length: height * width }, () => ({
      density: 0,
      xv: 0,
      yv: 0,
    }));
  }

  getCell(x: number, y: number): Cell {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return { density: 0, xv: 0, yv: 0 }; // This is a "Wall" cell that does not diffuse or have velocity
    }

    return this.cells[x + (y * this.width)];
  }

  diffuseCell(x: number, y: number) {
    const cell = this.getCell(x, y);
    const cellX1 = this.getCell(x + 1, y);
    const cellX2 = this.getCell(x - 1, y);
    const cellY1 = this.getCell(x, y + 1);
    const cellY2 = this.getCell(x, y - 1);

    const averageNeighboringDensity = (cellX1.density + cellX2.density + cellY1.density + cellY2.density) / 4;

    cell.density = cell.density * (1 - diffusionRate) + averageNeighboringDensity * diffusionRate;
  }
}
