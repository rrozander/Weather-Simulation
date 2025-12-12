export interface Cell {
  density: number;
  xv: number; // X velocity
  yv: number; // Y velocity
}


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
    return this.cells[x + (y * this.width)];
  }

  diffuseCell(x: number, y: number) {
    const cell = this.getCell(x, y);
    const cellX1 = this.getCell(x + 1, y);
    const cellX2 = this.getCell(x - 1, y);
    const cellY1 = this.getCell(x, y + 1);
    const cellY2 = this.getCell(x, y - 1);
    cell.density 
  }
}
