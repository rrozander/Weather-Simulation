import p5 from 'p5';

const sketch = (p: p5) => {
  const particles: Particle[] = [];
  const numParticles = 200;

  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;

    constructor() {
      this.x = p.random(p.width);
      this.y = p.random(-100, p.height);
      this.vx = p.random(-0.5, 0.5);
      this.vy = p.random(1, 3);
      this.size = p.random(2, 5);
      this.alpha = p.random(100, 200);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Add some wind effect
      this.vx += p.random(-0.01, 0.01);
      this.vx = p.constrain(this.vx, -1, 1);

      // Reset particle when it goes off screen
      if (this.y > p.height + 10) {
        this.y = p.random(-50, -10);
        this.x = p.random(p.width);
      }
      if (this.x < -10) this.x = p.width + 10;
      if (this.x > p.width + 10) this.x = -10;
    }

    draw() {
      p.noStroke();
      p.fill(200, 220, 255, this.alpha);
      p.ellipse(this.x, this.y, this.size);
    }
  }

  p.setup = () => {
    const container = document.getElementById('canvas-container');
    const canvas = p.createCanvas(800, 600);
    if (container) {
      canvas.parent(container);
    }

    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }
  };

  p.draw = () => {
    // Create gradient background
    const c1 = p.color(30, 40, 60);
    const c2 = p.color(60, 80, 120);
    
    for (let y = 0; y < p.height; y++) {
      const inter = p.map(y, 0, p.height, 0, 1);
      const c = p.lerpColor(c1, c2, inter);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    // Update and draw particles
    for (const particle of particles) {
      particle.update();
      particle.draw();
    }

    // Display info
    p.fill(255, 255, 255, 180);
    p.noStroke();
    p.textSize(14);
    p.textFont('monospace');
    p.text(`Particles: ${particles.length}`, 20, 30);
    p.text(`FPS: ${Math.round(p.frameRate())}`, 20, 50);
  };
};

new p5(sketch);

