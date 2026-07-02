/**
 * Animated navigation graph for the homepage.
 * Displays a central node connected to sub-page nodes with physics simulation.
 */
(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    centerNode: {
      radius: 18,
      color: '#1a1a1a'
    },
    pageNodes: [
      { name: 'About', color: '#648fff', radius: 30 },
      { name: 'Publications', color: '#4ca730', radius: 50 },
      { name: 'CV', color: '#dc267f', radius: 20 },
      { name: 'Projects', color: '#785ef0', radius: 40 }
    ],
    edges: {
      length: 100,
      stiffness: 0.0015,
      damping: 0.92,
    },
    physics: {
      repulsion: 2000,
      centerAttraction: 0.003
    }
  };

  // State
  let canvas, ctx;
  let nodes = [];
  let edges = [];
  let W, H, centerX, centerY;
  let animationId;
  let time = 0;

  // Node class
  class Node {
    constructor(config, isCenter = false) {
      this.name = config.name || '';
      this.radius = config.radius;
      this.color = config.color;
      this.isCenter = isCenter;
      this.phase = Math.random() * Math.PI * 2; // Random phase for oscillations
      
      // Center node stays fixed in the middle
      if (isCenter) {
        this.x = centerX;
        this.y = centerY;
        this.vx = 0;
        this.vy = 0;
      } else {
        this.x = centerX + (Math.random() - 0.5) * 200;
        this.y = centerY + (Math.random() - 0.5) * 200;
        this.vx = 0;
        this.vy = 0;
      }
      
      this.targetRadius = this.radius;
      this.targetColor = this.color;
      this.hovered = false;
    }

    updatePhysics() {
      // Apply forces
      let fx = 0, fy = 0;
      
      // Center node moves in elliptical pattern
      if (this.isCenter) {
        const ellipseA = 30; // Semi-major axis
        const ellipseB = 20; // Semi-minor axis
        const speed = 0.008;
        
        // Calculate target position on ellipse
        const targetX = centerX + Math.cos(time * speed) * ellipseA;
        const targetY = centerY + Math.sin(time * speed * 0.7) * ellipseB;
        
        // Gentle force toward elliptical position
        fx = (targetX - this.x) * 0.02;
        fy = (targetY - this.y) * 0.02;
        
        // Update velocity with damping
        this.vx = (this.vx + fx) * CONFIG.edges.damping;
        this.vy = (this.vy + fy) * CONFIG.edges.damping;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        return;
      }

      // Center attraction (except for center node itself)
      if (!this.isCenter) {
        fx += (centerX - this.x) * CONFIG.physics.centerAttraction;
        fy += (centerY - this.y) * CONFIG.physics.centerAttraction;
      }

      // Oscillating repulsion strength for continuous evolution (slower)
      let baseRepulsion = CONFIG.physics.repulsion;
      if (!this.isCenter) {
        baseRepulsion += Math.sin(time * 0.01 + this.phase) * 600;
      }

      // Repulsion from other nodes (stronger repulsion between page nodes)
      for (let other of nodes) {
        if (other === this) continue;
        let dx = this.x - other.x;
        let dy = this.y - other.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let repulsionForce = baseRepulsion / (dist * dist);
        
        // Increase repulsion between non-center nodes
        if (!this.isCenter && !other.isCenter) {
          repulsionForce *= 2.5;
        }
        
        fx += (dx / dist) * repulsionForce;
        fy += (dy / dist) * repulsionForce;
      }

      // Spring force from edges
      for (let edge of edges) {
        if (edge.n1 !== this && edge.n2 !== this) continue;
        let other = edge.n1 === this ? edge.n2 : edge.n1;
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let displacement = dist - CONFIG.edges.length;
        let force = CONFIG.edges.stiffness * displacement;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      // Add tiny fluctuating forces for organic movement (slower)
      fx += Math.sin(time * 0.002 + this.phase) * 0.15;
      fy += Math.cos(time * 0.0015 + this.phase * 1.3) * 0.15;

      // Update velocity with damping
      this.vx = (this.vx + fx) * CONFIG.edges.damping;
      this.vy = (this.vy + fy) * CONFIG.edges.damping;

      // Update position
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx) {
      // Draw node circle (reset shadow to avoid ghosting)
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Black border on hover
      if (this.hovered) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw text for page nodes with larger font
      if (!this.isCenter && this.name) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 24px "Yuyu", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, this.x, this.y);
      }
    }
  }

  // Edge class
  class Edge {
    constructor(n1, n2) {
      this.n1 = n1;
      this.n2 = n2;
      this.opacity = 1.0;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.n1.x, this.n1.y);
      ctx.lineTo(this.n2.x, this.n2.y);
      ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }

  // Initialize
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'graph-canvas';
    canvas.setAttribute('aria-label', 'Navigation graph');
    canvas.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, calc(-45% + 0px));
      pointer-events: none;
      z-index: 3;
    `;

    // Find the nav-grid and replace it
    const navGrid = document.querySelector('.hero .nav-grid');
    if (!navGrid) return;

    // Append canvas directly to body so it's viewport-centered
    // (not constrained by any parent container with overflow: hidden)
    document.body.appendChild(canvas);
    navGrid.style.display = 'none';

    ctx = canvas.getContext('2d');
    resize();

    // Create center node
    const centerNode = new Node(CONFIG.centerNode, true);
    nodes.push(centerNode);

    // Create page nodes
    CONFIG.pageNodes.forEach(config => {
      const node = new Node(config, false);
      nodes.push(node);

      // Create edge from center to this node
      edges.push(new Edge(centerNode, node));
    });

    // Setup canvas interactions (once)
    setupCanvasInteractions(canvas);

    // Start animation
    animate();
  }

  function setupCanvasInteractions(canvas) {
    canvas.style.pointerEvents = 'auto';

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let hovering = false;

      for (let n of nodes) {
        if (n.isCenter) continue;
        const dx = mx - n.x;
        const dy = my - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < n.radius) {
          hovering = true;
          n.hovered = true;
        } else {
          n.hovered = false;
        }
      }
      canvas.style.cursor = hovering ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let n of nodes) {
        if (n.isCenter) continue;
        const dx = mx - n.x;
        const dy = my - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < n.radius) {
          const idx = nodes.indexOf(n) - 1; // -1 for center node
          const pages = ['about.html', 'publications.html', 'cv.html', 'projects.html'];
          if (pages[idx]) {
            window.location.href = pages[idx];
          }
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      for (let n of nodes) {
        n.hovered = false;
      }
    });
  }

  function adjustBrightness(color, factor) {
    // Simple brightness adjustment
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const adjust = (c) => Math.min(255, Math.floor(c * factor));
    return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size based on viewport - allow larger since it can overflow
    const maxWidth = window.innerWidth * 1.0;
    const maxHeight = window.innerHeight * 0.65;
    const size = Math.max(600, Math.min(1000, maxWidth, maxHeight));

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    W = size;
    H = size;
    centerX = W / 2;
    centerY = H / 2;
  }

  function animate() {
    if (!ctx) return;

    // Apply DPR transform so drawing coordinates match CSS display size
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // Update physics
    for (let node of nodes) {
      node.updatePhysics();
    }

    // Draw edges
    for (let edge of edges) {
      edge.draw(ctx);
    }

    // Draw nodes
    for (let node of nodes) {
      node.draw(ctx);
    }

    time += 0.2;
    animationId = requestAnimationFrame(animate);
  }

  // Handle resize - keep center node centered
  window.addEventListener('resize', () => {
    const oldCenterX = centerX;
    const oldCenterY = centerY;
    resize();
    
    // Update center node position to new center
    if (nodes.length > 0 && nodes[0].isCenter) {
      nodes[0].x += (centerX - oldCenterX);
      nodes[0].y += (centerY - oldCenterY);
    }
  });

  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();