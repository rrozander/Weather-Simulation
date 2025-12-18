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

    // const centerX = width / 2;
    // const centerY = height / 2;

    this.cells = Array.from({ length: height * width }, () => {
      // Vector from center to this cell
      // const x = index % width;
      // const y = Math.floor(index / width);
      // const dx = x - centerX;
      // const dy = y - centerY;
      // const initxv = (dy) / 10;
      // const inityv = (dx) / 10;

      const initxv = 0;
      const inityv = 0;
      return {
        density: 0,
        xv: initxv,
        yv: - inityv
    }});
  }

  getCell(x: number, y: number): Cell {
    if (!this.isInBounds(x, y)) {
      const clampedX = this.clamp(x, 0, this.width - 1);
      const clampedY = this.clamp(y, 0, this.height - 1);

      // Density should be 0 but velocity should be the same as the cell on the edge of the grid.
      // This should depend on what edge it is hitting. -> if Vert wall: X opposite force, Y same force, if Horz wall: X same force, Y opposite force.
      // Also need cases for the corners where it will conteract both.
      return { density: 0, xv: this.cells[clampedX + (clampedY * this.width)].xv, yv: this.cells[clampedX + (clampedY * this.width)].yv };
    }

    return this.cells[x + (y * this.width)];
  }

  getCellFromSnapshot(x: number, y: number, gridSnapshot: Cell[]): Cell {
    if (!this.isInBounds(x, y)) {
      return { density: 0, xv: 0, yv: 0 }; // This is a "Wall" cell that does not diffuse or have velocity
    }

    return gridSnapshot[x + (y * this.width)];
  }


  diffuse(diffusionRate: number) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        const cellX1 = this.getCell(x + 1, y);
        const cellX2 = this.getCell(x - 1, y);
        const cellY1 = this.getCell(x, y + 1);
        const cellY2 = this.getCell(x, y - 1);

        const averageNeighboringDensity = (cellX1.density + cellX2.density + cellY1.density + cellY2.density) / 4;

        cell.density = cell.density * (1 - diffusionRate) + averageNeighboringDensity * diffusionRate;
      }
    }
  }

  advect(timestep: number, gridSnapshot: Cell[], advectionStrength: number, type: 'velocity' | 'density') {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {

        // current position - (velocity (m/s) * timestep (1/s) = distance (m)) => previous position
        const prevCell = this.getCellFromSnapshot(x, y, gridSnapshot);
        const prevXUnclamped = x - (timestep * prevCell.xv * advectionStrength); 
        const prevYUnclamped = y - (timestep * prevCell.yv * advectionStrength);

        // Clamp position to be within the grid
        const prevPositionX = this.clamp(prevXUnclamped, 0.5, this.width - 0.5);
        const prevPositionY = this.clamp(prevYUnclamped, 0.5, this.height - 0.5);

        // Bilinear interpolation
        const currentCell = this.getCell(x, y);
        if (type === 'velocity') {
          const newWind = this.interpolateWind(prevPositionX, prevPositionY, gridSnapshot);
          currentCell.xv = newWind.xWind;
          currentCell.yv = newWind.yWind;
        } else if (type === 'density') {
          const newDensity = this.interpolateDensity(prevPositionX, prevPositionY, gridSnapshot);
          currentCell.density = newDensity;
        }
      }
    }
  }


  project(iterations: number = 10) {
    const w = this.width, h = this.height;
    const n = w * h;
  
    const idx = (x: number, y: number) => x + y * w;
  
    // divergence and pressure fields (not stored on Cell)
    const div = new Float32Array(n);
    const p = new Float32Array(n);
    const pNext = new Float32Array(n);
  
    // 1) divergence from current velocity
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const uR = this.getCell(x + 1, y).xv;
        const uL = this.getCell(x - 1, y).xv;
        const vB = this.getCell(x, y + 1).yv;
        const vT = this.getCell(x, y - 1).yv;
  
        div[idx(x, y)] = (uR - uL + vB - vT) * -0.5; // h = 1 cells
        p[idx(x, y)] = 0;
      }
    }
  
    // 2) solve Laplacian(p) = div (Jacobi iterations)
    for (let k = 0; k < iterations; k++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = idx(x, y);
  
          // simple “copy edge” boundary via clamping
          const pL = p[idx(Math.max(x - 1, 0), y)];
          const pR = p[idx(Math.min(x + 1, w - 1), y)];
          const pT = p[idx(x, Math.max(y - 1, 0))];
          const pB = p[idx(x, Math.min(y + 1, h - 1))];
  
          pNext[i] = (pL + pR + pT + pB + div[i]) * 0.25;
        }
      }
      p.set(pNext);
    }
  
    // 3) subtract pressure gradient from velocity
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = this.getCell(x, y);
  
        const pL = p[idx(Math.max(x - 1, 0), y)];
        const pR = p[idx(Math.min(x + 1, w - 1), y)];
        const pT = p[idx(x, Math.max(y - 1, 0))];
        const pB = p[idx(x, Math.min(y + 1, h - 1))];
  
        cell.xv -= (pR - pL) * 0.5;
        cell.yv -= (pB - pT) * 0.5;
      }
    }
  }

//   applyPressureForceAtCell(x: number, y: number, timestep: number) {
//     const windStrength = 50;

//     const gradientX = this.getCell(x + 1, y).density - this.getCell(x - 1, y).density;
//     const gradientY = this.getCell(x, y + 1).density - this.getCell(x, y - 1).density;

//     // Wind flows FROM High TO Low.
//     // If gradX is positive (Right is denser), we want to push LEFT (negative).
//     // So we subtract the gradient.
//     const currentCell = this.getCell(x, y);
//     currentCell.xv -= gradientX * windStrength * timestep;
//     currentCell.yv -= gradientY * windStrength * timestep;
// }

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
    const rightIdxX = this.clamp(leftIdxX + 1, 0, this.width - 1);
    const topIdxY = Math.floor(prevPositionY);
    const bottomIdxY = this.clamp(topIdxY + 1, 0, this.height - 1);

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

  interpolateDensity(
    prevPositionX: number,
    prevPositionY: number,
    gridSnapshot: Cell[]
  ): number {
    const leftIdxX = Math.floor(prevPositionX);
    const rightIdxX = this.clamp(leftIdxX + 1, 0, this.width - 1);
    const topIdxY = Math.floor(prevPositionY);
    const bottomIdxY = this.clamp(topIdxY + 1, 0, this.height - 1);

    const xWeight = (prevPositionX) - leftIdxX;
    const yWeight = (prevPositionY) - topIdxY;


    const topLeftCell = this.getCellFromSnapshot(leftIdxX, topIdxY, gridSnapshot);
    const topRightCell = this.getCellFromSnapshot(rightIdxX, topIdxY, gridSnapshot);
    const bottomLeftCell = this.getCellFromSnapshot(leftIdxX, bottomIdxY, gridSnapshot);
    const bottomRightCell = this.getCellFromSnapshot(rightIdxX, bottomIdxY, gridSnapshot);

    const topDensity = this.lerp(topLeftCell.density, topRightCell.density, xWeight);
    const bottomDensity = this.lerp(bottomLeftCell.density, bottomRightCell.density, xWeight);

    const newDensity = this.lerp(topDensity, bottomDensity, yWeight);

    return newDensity;
  }
}
