const container = document.getElementById("blocks-container");

const blocks = [
  { 
    title: "about me", 
    link: "#", 
    color: "#F92672", 
    width: 500, 
    height: 200, 
    fontSize: 100, 
    fontWeight: 'bold', 
    fontFamily: 'Arial, sans-serif',
    x: 300,  // Initial x position
    y: 0     // Initial y position
  }, 
  { 
    title: "publications", 
    link: "#", 
    color: "#AE81FF", 
    width: 800, 
    height: 200, 
    fontSize: 100, 
    fontWeight: 'bold', 
    fontFamily: 'Arial, sans-serif',
    x: 700, 
    y: -500 
  }, 
  { 
    title: "CV", 
    link: "#", 
    color: "#66D9EF", 
    width: 300, 
    height: 200, 
    fontSize: 100, 
    fontWeight: 'bold', 
    fontFamily: 'Arial, sans-serif',
    x: 1100, 
    y: -1000 
  }, 
  { 
    title: "projects", 
    link: "#", 
    color: "#A6E22E", 
    width: 500, 
    height: 200, 
    fontSize: 100, 
    fontWeight: 'bold', 
    fontFamily: 'Arial, sans-serif',
    x: 1500, 
    y: -1500
  }, 
];

const gravity = 0.01;
const friction = 0.5;
const angularFriction = 0.5;

class Block {
  constructor(block) {
    this.title = block.title;
    this.link = block.link;
    this.width = block.width;
    this.height = block.height;
    this.color = block.color;
    this.fontSize = block.fontSize;
    this.fontWeight = block.fontWeight;
    this.fontFamily = block.fontFamily;
    this.element = this.createElement();
    this.body = Matter.Bodies.rectangle(block.x, block.y, this.width, this.height, {
      restitution: 0.2,
      friction: 0.1,
      frictionAir: 0.05,
      density: 0.005
    });
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'block';
    div.textContent = this.title;
    div.style.width = this.width + 'px';
    div.style.height = this.height + 'px';
    div.style.backgroundColor = this.color;
    div.style.fontSize = this.fontSize + 'px';
    div.style.fontWeight = this.fontWeight;
    div.style.fontFamily = this.fontFamily;
    div.addEventListener('click', () => {
      if (this.link !== '#') {
        window.open(this.link, '_blank');
      }
    });
    container.appendChild(div);
    return div;
  }

  update() {
    this.element.style.left = (this.body.position.x - this.width / 2) + 'px';
    this.element.style.top = (this.body.position.y - this.height / 2) + 'px';
    this.element.style.transform = `rotate(${this.body.angle * 180 / Math.PI}deg)`;
  }
}

const blockObjects = blocks.map(b => new Block(b));

// Create Matter.js engine
const engine = Matter.Engine.create();
const world = engine.world;

// Add blocks to world
blockObjects.forEach(block => {
  Matter.World.add(world, block.body);
});

// Add boundaries
const ground = Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true });
const leftWall = Matter.Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
const rightWall = Matter.Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });

Matter.World.add(world, [ground, leftWall, rightWall]);

// Create runner
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

// Update DOM
Matter.Events.on(engine, 'afterUpdate', () => {
  blockObjects.forEach(block => block.update());
});