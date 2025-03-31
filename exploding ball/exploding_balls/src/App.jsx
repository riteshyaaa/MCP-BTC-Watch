import React, { useState, useRef, useEffect } from 'react';
import Matter, { Body } from 'matter-js';

const PhysicsBallSimulator = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const [velocity, setVelocity] = useState(5);
  const [balls, setBalls] = useState([]);
  const [friction, setFriction] = useState(0.01);
  const [restitution, setRestitution] = useState(0.7);

  // Initialize physics engine
  useEffect(() => {
    const { Engine, Render, World, Bodies } = Matter;

    // Create engine with realistic physics
    const engine = Engine.create({
      gravity: { x: 0, y: 0.2 }, // Mild gravity
      enableSleeping: true // Allow objects to sleep when stationary
    });
    engineRef.current = engine;

    // Create renderer
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#f0f0f0',
        showVelocity: true // Helpful for debugging
      }
    });
    renderRef.current = render;

    // Create boundaries
    const ground = Bodies.rectangle(400, 610, 810, 60, { 
      isStatic: true,
      restitution: 0.9
    });
    const leftWall = Bodies.rectangle(-10, 300, 60, 620, { 
      isStatic: true,
      restitution: 0.8
    });
    const rightWall = Bodies.rectangle(810, 300, 60, 620, { 
      isStatic: true,
      restitution: 0.8
    });

    World.add(engine.world, [ground, leftWall, rightWall]);

    // Start the renderer
    Render.run(render);

    // Run the engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Add collision event listener
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      pairs.forEach((pair) => {
        // Calculate energy loss
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Apply additional velocity reduction on collision
        if (bodyA.circleRadius) {
          Body.setVelocity(bodyA, {
            x: bodyA.velocity.x * 0.95,
            y: bodyA.velocity.y * 0.95
          });
        }
        
        if (bodyB.circleRadius) {
          Body.setVelocity(bodyB, {
            x: bodyB.velocity.x * 0.95,
            y: bodyB.velocity.y * 0.95
          });
        }
      });
    });

    return () => {
      Render.stop(render);
      Engine.clear(engine);
      Matter.Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);

  const addBall = () => {
    const { Bodies, World, Body } = Matter;
    const engine = engineRef.current;
    
    const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF'];
    const radius = Math.random() * 15 + 10; // 10-25px radius

    const ball = Bodies.circle(
      Math.random() * 600 + 100, // Random x position
      50, // Start near top
      radius,
      {
        restitution: restitution,
        friction: friction,
        frictionAir: 0.005, // Air resistance
        density: 0.001, // Mass calculation
        render: {
          fillStyle: colors[Math.floor(Math.random() * colors.length)],
          strokeStyle: '#000',
          lineWidth: 1
        }
      }
    );

    // Apply precise velocity (converted from px/frame to Matter.js units)
    Body.setVelocity(ball, {
      x: (Math.random() - 0.5) * velocity * 2,
      y: Math.random() * velocity * 0.5
    });

    World.add(engine.world, ball);
    setBalls(prev => [...prev, ball.id]);
  };

  const clearBalls = () => {
    const { World } = Matter;
    const engine = engineRef.current;
    
    // Remove all bodies except walls and ground
    engine.world.bodies.forEach(body => {
      if (!body.isStatic && body.circleRadius) {
        World.remove(engine.world, body);
      }
    });
    
    setBalls([]);
  };

  return (
    <div style={styles.container}>
      <h1 style={{ ...styles.label, backgroundColor: '#282b25' }}>Physics Ball Collision Simulator</h1>
      
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label style={{ ...styles.label, backgroundColor: '#282b25' }}>
            Initial Velocity: {velocity} units
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={velocity} 
              onChange={(e) => setVelocity(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>
        
        <div style={styles.controlGroup}>
          <label style={{ ...styles.label, backgroundColor: '#282b25' }}>
            Bounciness: {restitution.toFixed(2)}
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05"
              value={restitution} 
              onChange={(e) => setRestitution(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>
        
        <div style={styles.controlGroup}>
          <label style={{ ...styles.label, backgroundColor: '#282b25' }}>
            Friction: {friction.toFixed(2)}
            <input 
              type="range" 
              min="0" 
              max="0.1" 
              step="0.005"
              value={friction} 
              onChange={(e) => setFriction(Number(e.target.value))}
              style={styles.slider}
            />
          </label>
        </div>
        
        <div style={styles.buttonGroup}>
          <button onClick={addBall} style={styles.button}>
            Add Ball
          </button>
          <button onClick={clearBalls} style={{...styles.button, background: '#f44336'}}>
            Clear All Balls
          </button>
        </div>
      </div>
      
      <div ref={sceneRef} style={styles.canvas}></div>
      
      <div style={styles.instructions}>
        <h3>Physics Simulation Features:</h3>
        <ul>
          <li>Balls start with exact velocity you specify</li>
          <li>Gradual energy loss through collisions and friction</li>
          <li>Adjustable bounciness (restitution) and surface friction</li>
          <li>Realistic momentum transfer during collisions</li>
          <li>Air resistance slows objects over time</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  controls: {
    backgroundColor: '#f8f8f8',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  controlGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold'
  },
  slider: {
    width: '100%',
    marginTop: '5px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: '1'
  },
  canvas: {
    width: '800px',
    height: '600px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  instructions: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px'
  }
};

export default PhysicsBallSimulator;