import { Bodies, Engine, Render, World, Runner, Body, Sleeping, Events } from "matter-js";
import { FRUITS } from "./fruits";

// -----


const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.getElementById("game"),
  options: {
    width: 620,
    height: 850,
    wireframes: false,
    background: "#F7F4C8",
  },
});

const world = engine.world;
// Elements - box
const ground = Bodies.rectangle(310, 820, 620, 60, { // x, y, width, height
  isStatic: true,
  render: {
    fillStyle: "#E6b143",
  },
});
const leftWall = Bodies.rectangle(15, 395, 30, 790, { // x, y, width, height
  isStatic: true,
  render: {
    fillStyle: "#E6b143",
  },
});
const rightWall = Bodies.rectangle(605, 395, 30, 790, { // x, y, width, height
  isStatic: true,
  render: {
    fillStyle: "#E6b143",
  },
});
const topLine = Bodies.rectangle(310, 150, 620, 2, { // x, y, width, height
  isStatic: true,
  isSensor: true, // permet de ne pas avoir de collision avec les fruits
  render: {
    fillStyle: "#E6b14320",
  },
  label: "topLine",
});



// Add elements to the world
World.add(world, [ground, leftWall, rightWall, topLine]);


// Run the engine
Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let interval_left = null;
let interval_right = null;  // séparation des intervalles pour fluidifier le déplacement lors d'un changement de position. Si l'on utilise le même intervalle pour gauche et droite, le déplacement devient saccadé
let disableActionAddFruit = false;
let scoreValueOrigine = (index) => {
  return FRUITS[index].scoreValue;
}
let scoreValue = 0;
let scorePrint = document.getElementById("scoreValue");
scorePrint.innerText = scoreValue;

function addCurrentFruit() {
  const randomFruit = getRandomFruit();
  const body = Bodies.circle(300, 50, randomFruit.radius, { // x, y, radius
    label: randomFruit.label, // permet de connaôtre quel type de fruit rentre en collision
    render: {
      fillStyle: randomFruit.color,
      sprite: {
        texture: `./${randomFruit.label}.webp`,
      },
    },
    isSleeping: true, // n'est pas soumis à la gravité tant qu'il n'est pas réveillé
    restitution: 0.1,
  });

  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, [body]);
}

function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * 5); // on limite l'index à 5 pour avoir les fruits plus petits
  const fruit = FRUITS[randomIndex];

  if (currentFruit?.label === fruit.label) {
    return getRandomFruit();
  } // méthode récursive pour éviter d'avoir deux fruits identiques à la suite
  return fruit;
}


// -----------------
// Ecouteurs d'évènements
window.onkeydown = (event) => {
  switch (event.code) {
    case "ArrowLeft":
      if (interval_left) return;
      interval_left = setInterval(() => {
        if (currentBody.position.x - 20 > 31) {

          Body.setPosition(currentBody, { x: currentBody.position.x - 5, y: currentBody.position.y });
        }
      }, 5);
      break;
    case "ArrowRight":
      if (interval_right) return;
      interval_right = setInterval(() => {
        if (currentBody.position.x + 20 < 589) {

          Body.setPosition(currentBody, { x: currentBody.position.x + 5, y: currentBody.position.y });
        }
      }, 5);
      break;
    case "Space":
      if (disableActionAddFruit) return;
      Sleeping.set(currentBody, false);
      currentBody = null;
      disableActionAddFruit = true;
      setTimeout(() => {
        addCurrentFruit();
        disableActionAddFruit = false;
      }, 1000);
      break;
  }
};

window.onkeyup = (event) => {
  switch (event.code) {
    case "ArrowLeft":
      clearInterval(interval_left);
      interval_left = null;
      break;
    case "ArrowRight":
      clearInterval(interval_right);
      interval_right = null;
      break;
  }
};

Events.on(engine, "collisionStart", (event) => {
  //  si un élement du même index ou label rentre en collision, on transforme le fruit en un fruit de l'index supérieur
  event.pairs.forEach((collision) => {
    const { bodyA, bodyB } = collision;
    if (bodyA.label === bodyB.label) {
      World.remove(world, [bodyA, bodyB]);

      const index = FRUITS.findIndex((fruit) => fruit.label === bodyA.label); // on récupère l'index du fruit qui vient de rentrer en collision
      if (index === FRUITS.length - 1) {
        // on efface le fruit le plus gros après un certains délai
        const timer = setTimeout(() => {
          World.remove(world, [bodyA]);
        }, 1000);
        Events.on(engine, "afterUpdate", () => {
          if (timer) {
            clearTimeout(timer);
          }
        });
        return;
      } // si l'index est le dernier, on ne fait rien (on ne peut pas aller au delà)
      const nextFruit = FRUITS[index + 1]; // on récupère le fruit suivant

      const body = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        nextFruit.radius,
        {
          label: nextFruit.label,
          render: {
            fillStyle: nextFruit.color,
            sprite: {
              texture: `./${nextFruit.label}.webp`,
            },
          },
          restitution: 0.1,
        }
      );
      World.add(world, [body]);
      const fruitSound = document.getElementById("fruitSound");
      fruitSound.play();
      // on ajoute le score
      scoreValue += scoreValueOrigine(index + 1); // on ajoute le score du fruit suivant
      scorePrint.innerHTML = scoreValue; // on affiche le score

    }
    if ((bodyA.label === "topLine" || bodyB.label === "topLine") && !disableActionAddFruit) {
      // si le fruit touche la ligne du haut, on le supprime
      alert("Game over");
    }
  });
});



addCurrentFruit();