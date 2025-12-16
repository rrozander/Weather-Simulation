export interface Cell {
  density: number;
  xv: number; // Horizontal Wind Velocity
  yv: number; // Vertical Wind Velocity
}

export class Grid {
  height: number;
  width: number;
  cells: Cell[];

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
    this.cells = Array.from({ length: height * width }, (_, index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      return {
        density: 0,
        // xv: (Math.random() * 5) * (Math.random() < 0.5 ? -1 : 1),
        // yv: (Math.random() * 5) * (Math.random() < 0.5 ? -1 : 1)
        // xv: (x + y) % 2 === 0 ? 5 : -5,
        // yv: 0.0
        xv: -0.7,
        yv: 1
    }});
  }

  getCell(x: number, y: number): Cell {
    if (!this.isInBounds(x, y)) {
      return { density: 0, xv: 0, yv: 0 }; // This is a "Wall" cell that does not diffuse or have velocity
    }

    return this.cells[x + (y * this.width)];
  }

  getCellFromSnapshot(x: number, y: number, gridSnapshot: Cell[]): Cell {
    if (!this.isInBounds(x, y)) {
      return { density: 0, xv: 0, yv: 0 }; // This is a "Wall" cell that does not diffuse or have velocity
    }

    return gridSnapshot[x + (y * this.width)];
  }


  diffuseCell(x: number, y: number, diffusionRate: number) {
    const cell = this.getCell(x, y);
    const cellX1 = this.getCell(x + 1, y);
    const cellX2 = this.getCell(x - 1, y);
    const cellY1 = this.getCell(x, y + 1);
    const cellY2 = this.getCell(x, y - 1);

    const averageNeighboringDensity = (cellX1.density + cellX2.density + cellY1.density + cellY2.density) / 4;

    cell.density = cell.density * (1 - diffusionRate) + averageNeighboringDensity * diffusionRate;
  }

  advectCell(x: number, y: number, timestep: number, gridSnapshot: Cell[]) {
    const centerX = x + 0.5;
    const centerY = y + 0.5;

    // current position - (velocity (m/s) * timestep (1/s) = distance (m)) => previous position
    const prevCell = this.getCellFromSnapshot(x, y, gridSnapshot);
    const prevXUnclamped = centerX - (timestep * prevCell.xv); 
    const prevYUnclamped = centerY - (timestep * prevCell.yv);

    // Clamp position to be within the grid
    const prevPositionX = this.clamp(prevXUnclamped, 0, this.width - 1);
    const prevPositionY = this.clamp(prevYUnclamped, 0, this.height - 1);


    //console.log("Prev Position: ", prevPositionX, prevPositionY);
    // Get wind at previous position
    //const prevCell = this.getCell(Math.floor(prevPositionX), Math.floor(prevPositionY));
    // const prevWindX = prevCell.xv;
    // const prevWindY = prevCell.yv;

    // Bilinear interpolation
    // TODO: Might need to fix this if it is not working.

    const newWind = this.interpolateWind(prevPositionX, prevPositionY, gridSnapshot);

    const currentCell = this.getCell(x, y);
    currentCell.xv = newWind.xWind;
    currentCell.yv = newWind.yWind;
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }

  lerp(a: number, b: number, weight: number) {
    return a + weight * (b - a);
  }

  interpolateWind(
    prevPositionX: number,
    prevPositionY: number,
    gridSnapshot: Cell[]
  ): {xWind: number, yWind: number} {
    const leftIdxX = Math.floor(prevPositionX);
    const rightIdxX = leftIdxX + 1;
    const topIdxY = Math.floor(prevPositionY);
    const bottomIdxY = topIdxY + 1;

    const xWeight = (prevPositionX) - leftIdxX;
    const yWeight = (prevPositionY) - topIdxY;


    const topLeftCell = this.getCellFromSnapshot(leftIdxX, topIdxY, gridSnapshot);
    const topRightCell = this.getCellFromSnapshot(rightIdxX, topIdxY, gridSnapshot);
    const bottomLeftCell = this.getCellFromSnapshot(leftIdxX, bottomIdxY, gridSnapshot);
    const bottomRightCell = this.getCellFromSnapshot(rightIdxX, bottomIdxY, gridSnapshot);

    const topWindX = this.lerp(topLeftCell.xv, topRightCell.xv, xWeight);
    const bottomWindX = this.lerp(bottomLeftCell.xv, bottomRightCell.xv, xWeight);

    const xWind = this.lerp(topWindX, bottomWindX, yWeight);

    const topWindY = this.lerp(topLeftCell.yv, topRightCell.yv, xWeight);
    const bottomWindY = this.lerp(bottomLeftCell.yv, bottomRightCell.yv, xWeight);

    const yWind = this.lerp(topWindY, bottomWindY, yWeight);

    return {xWind, yWind};
  }
}
