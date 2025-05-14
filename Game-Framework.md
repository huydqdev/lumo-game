# LLM Game Generation Knowledge Framework (Phaser JS)

## 1. Overall Objective

This framework guides a Large Language Model (LLM) to generate JavaScript (ES6+) code using Phaser 3 for creating a complete game (or game components) based on a provided Game Design Document (GDD). The focus is on producing well-structured, readable code that utilizes placeholder graphics and adheres to Phaser 3 conventions.

## 2. Core Technology and Environment

* **Language:** JavaScript (ES6+)
* **Game Framework:** Phaser 3 (latest stable version)
* **Target Environment:** Web Browser
* **Physics:** Default to Phaser's Arcade Physics, unless specified otherwise in the GDD.

## 3. Key Constraints and Focus Areas

1.  **Audio:** **COMPLETELY IGNORE** all references to sound effects (SFX), background music (BGM), or any audio elements. Do not generate any audio loading or playback code.
2.  **Visual Assets:**
    * **REPLACE** all visual assets (sprites, images, tilesets, backgrounds) with placeholder graphics.
    * Use simple Phaser geometric shapes (e.g., `this.add.rectangle(...)`, `this.add.circle(...)`, `this.add.graphics().fillRectShape(...)`) with distinct colors and appropriate dimensions as specified in the GDD or inferred from it.
    * **DO NOT** use `this.load.image()`, `this.load.spritesheet()` for visual assets in `preload()`. Instead, prepare to draw placeholders directly in the `create()` methods of Scenes. If reusable placeholder textures are needed, use `this.textures.generate()` in `preload()` or `create()`.
    * Clearly label placeholders in code comments (e.g., `// Placeholder for Player Sprite`).
3.  **Game Dimensions & Scaling:**
    * **Default Fixed Dimensions:** The game should be configured with fixed `width` and `height` dimensions as specified in the GDD.
    * **Mobile Scaling:** If the GDD indicates a mobile target or requires responsiveness, implement scaling using Phaser's Scale Manager to fit the screen while maintaining aspect ratio (e.g., `mode: Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`). If no specific mobile requirement, default to fixed size without dynamic scaling beyond initial setup.
4.  **Implementation Focus (Prioritized Order):**
    * **Game Flow:** Transitions between different game states/Scenes (e.g., Menu -> Gameplay -> Game Over).
    * **Game Mechanics:** Core rules, player actions, key interactions (e.g., movement, jumping, shooting, item collection).
    * **Game Logic:** State changes, win/loss conditions, scoring, basic AI behavior (if any).
    * **Collision Detection & Response:** Interactions between specified game objects using Phaser's physics systems.
    * **Layout & Positioning:** Accurate placement and sizing of all elements (using placeholders) within the game canvas/Scenes according to the GDD.
    * **Layering/Depth:** Ensure elements are rendered in the correct visual order (e.g., UI on top of gameplay elements using `setDepth()`).
5.  **Code Structure:**
    * Generate well-structured, readable code.
    * Utilize **Phaser Scenes** for different game states.
    * Employ **JavaScript Classes** for game entities (Player, Enemy, Item, Projectile, etc.) when they possess complex behavior or properties, extending Phaser's base classes (e.g., `Phaser.Physics.Arcade.Sprite`, `Phaser.GameObjects.Container`).
    * Include comments explaining complex logic or significant design decisions.
6.  **Desired Output:** Provide complete, runnable code, typically comprising:
    * `index.html`: To load the game.
    * `game.js` (or `main.js`): To configure and initialize Phaser.
    * Separate JavaScript files for each Phaser Scene (e.g., `BootScene.js`, `PreloadScene.js`, `MainMenuScene.js`, `GameplayScene.js`, `UIScene.js`, `GameOverScene.js`).
    * Separate JavaScript files for entity classes (e.g., `Player.js`, `Enemy.js`).

## 4. Input for the LLM

1.  **Game Design Document (GDD):** (User-provided separately) - This document details the game to be created (story, characters, mechanics, levels, game flow, controls, win/loss conditions, etc.).
2.  **This Context Framework:** (The entirety of this document) - Provide to the LLM in the same prompt or as part of its system instructions/context.

## 5. Code Generation Steps (LLM to process sequentially, referencing GDD extensively)

### Phase 1: Project Setup & Basic Configuration

1.  **`index.html`:**
    * Create a basic HTML structure.
    * Include a `<div>` or `<canvas>` element for the game.
    * `<script>` tags to load the Phaser 3 library and the game's source files.
2.  **Main Game File (`game.js` or equivalent):**
    * Define the Phaser configuration object (`config`).
    * `type`: `Phaser.AUTO`.
    * `width`, `height`: Set to fixed dimensions from GDD.
    * `scale`: Configure Scale Manager. If mobile scaling is required by GDD, include `mode: Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`. Otherwise, basic setup for fixed size.
    * `physics`: Configure the physics system (e.g., `default: 'arcade'`, `arcade: { gravity: { y: 300 }, debug: false }`). `debug` should be `true` during development if the GDD requires visual physics bodies.
    * `scene`: An array of Scene classes to be used.
    * Instantiate `new Phaser.Game(config)`.

### Phase 2: Scene Definition & Structure

1.  **Identify Scenes:** Based on the GDD's **Game Flow** section, identify all necessary game states/screens. Common scenes include:
    * `BootScene`: Basic setup, potentially loads minimal assets for the preloader (often can be merged into `PreloadScene`).
    * `PreloadScene`: Loads *all* game assets (or prepares for placeholder creation). Displays a loading indicator.
    * `MainMenuScene`: Displays game title, "Start" button, possibly instructions or high scores.
    * `GameplayScene`: The main scene where the core game loop occurs.
    * `UIScene`: Often runs in parallel with `GameplayScene` to display static UI elements like score, health, etc., ensuring they stay on top and are not affected by the gameplay camera.
    * `GameOverScene`: Displays final score, win/loss message, and options to restart or return to the main menu.
2.  **Create Scene Files:** Generate a separate `.js` file for each identified Scene. Each file should define a class extending `Phaser.Scene` and include standard methods (`constructor`, `init`, `preload`, `create`, `update`).

### Phase 3: Asset Loading (Or Placeholder Preparation)

1.  **`PreloadScene` - `preload()` Method:**
    * If any placeholder textures need to be generated using `this.textures.generate()`, do it here.
    * **Crucially:** Implement a loading progress indicator (e.g., a simple rectangle shape that fills based on load progress) and logic to transition to the `MainMenuScene` (or the first playable scene) once loading is complete (`this.load.on('complete', ...)`). If there are no actual assets to `this.load`, transition after a brief display or immediately.

### Phase 4: Core Gameplay Scene Implementation (`GameplayScene`)

1.  **`init(data)` Method (if applicable):**
    * Receive data passed from a previous Scene (e.g., player choices from a menu).
2.  **`create()` Method:**
    * **Background & Environment:** Draw placeholder graphics for the background and any static environmental elements as per GDD, respecting **Layout & Positioning** and **Layering/Depth** (using `setDepth()`).
    * **Physics Setup (if needed):** E.g., `this.physics.world.setBounds(...)`.
    * **Game Objects:**
        * For each dynamic entity (Player, Enemies, Items, Projectiles) defined in the GDD:
            * **Create Entity Class:** If the entity has complex behavior or properties, create a separate JavaScript class (e.g., `Player extends Phaser.Physics.Arcade.Sprite`) in its own file (e.g., `Player.js`). This class should include a `constructor`, methods for managing state and behavior (`update`), and relevant properties (health, speed, etc.).
            * In `GameplayScene`, instantiate the entity: `this.player = new Player(this, x, y);`.
            * **Placeholder Graphics:** Within the entity class's constructor or immediately after instantiation in the Scene, draw/add placeholder graphics. For example, if `Player` extends `Phaser.GameObjects.Container`, you might `this.add(this.scene.add.rectangle(0, 0, width, height, color))` inside the `Player` constructor. If extending `Phaser.Physics.Arcade.Sprite`, you might create a simple texture using `this.scene.textures.generate` in `PreloadScene`'s `preload` and pass its key to `super()`.
            * **Physics:** Enable physics for the entity (`this.physics.add.existing(gameObject)` if not automatically handled by the parent class). Set physics properties (e.g., `setImmovable`, `setCollideWorldBounds`, `setBounce`, `setDrag`, `setMaxVelocity`) based on the GDD.
            * **Position and Depth:** Set the entity's initial position and `depth`.
            * **Groups:** Add the entity to relevant `Phaser.GameObjects.Group` or `Phaser.Physics.Arcade.Group` instances for collision management (e.g., `this.playersGroup = this.physics.add.group()`, `this.enemiesGroup = this.physics.add.group()`).
    * **Input Handling:**
        * Initialize input listeners (keyboard: `this.input.keyboard.createCursorKeys()`, `this.input.keyboard.addKey(...)`; mouse/touch: `this.input.on('pointerdown', ...)`). Refer to the GDD for control schemes.
    * **Collision Detection:**
        * Set up colliders and overlaps between relevant groups/objects (`this.physics.add.collider(groupA, groupB, handlerFunction, processCallback, this)` or `this.physics.add.overlap(...)`).
        * Implement the `handlerFunction` for each collision pair, referencing the GDD for the *outcome* of the collision (e.g., score change, health decrease, object destruction, state change).
    * **Initial Game State:** Set up initial scores, lives, timers, etc., based on the GDD's **Game Logic**.
3.  **`update(time, delta)` Method:**
    * **Input Processing:** Read input states (e.g., `if (this.cursors.left.isDown)`).
    * **Update Game Object Logic:**
        * Call `update(time, delta)` methods on custom entity instances (if they exist).
        * Implement movement logic based on input or AI patterns (**Game Mechanics** from GDD).
        * Implement shooting/spawning logic (**Game Mechanics** from GDD - check timers, conditions).
        * Apply physics forces/velocities.
    * **Check Game Conditions:** Evaluate win/loss conditions based on **Game Logic** (e.g., time limit reached, score achieved, player health <= 0).
    * **Trigger Scene Transitions:** If a win/loss condition is met, use `this.scene.start('GameOverScene', { score: currentScore })` or similar, passing necessary data according to the **Game Flow**.

### Phase 5: UI Scene Implementation (`UIScene`) (If applicable)

1.  **`create()` Method:**
    * Add text objects (`this.add.text`) for score, lives, timers, etc. Position them according to the GDD's **Layout & Positioning** (e.g., top-left, top-right). Ensure UI elements have `setScrollFactor(0)` so they don't move with the camera.
    * Style the text (font size, color - keep it simple).
    * Use the Scene's Event Emitter (`this.game.events.on(...)`, `this.game.events.emit(...)`) or Phaser Registry (`this.registry.get(...)`, `this.registry.set(...)`, `this.registry.events.on('changedata-key', ...)` ) for `UIScene` to listen for updates from `GameplayScene` (e.g., score changes) and update text elements accordingly.
    * Ensure this Scene is launched correctly (often in parallel with `GameplayScene`: in `GameplayScene`'s `create`, call `this.scene.launch('UIScene')`). Ensure this scene renders *on top* of `GameplayScene` (usually managed by scene launch order or `bringToTop` if needed).

### Phase 6: Other Scenes Implementation (`MainMenuScene`, `GameOverScene`, etc.)

1.  **`MainMenuScene`:**
    * `create()`: Draw title (placeholder), add interactive text or placeholder rectangles for buttons ("Start", "Options" if any). Add input listeners (`setInteractive()`, `on('pointerdown', ...)`). On button click, start the `GameplayScene` (and potentially `UIScene`) according to the **Game Flow**.
2.  **`GameOverScene`:**
    * `init(data)`: Receive data passed from `GameplayScene` (e.g., final score).
    * `create()`: Display "Game Over" text, the final score (from `data`), and placeholder buttons ("Restart", "Main Menu"). Add input listeners to transition to `GameplayScene` or `MainMenuScene` respectively, following the **Game Flow**.

### Phase 7: Final Code Structure & Refinement

1.  **Review:** Ensure all specified **Game Mechanics**, **Game Logic**, **Game Flows**, and **Layouts** from the GDD have been addressed using placeholders and correct positioning/layering.
2.  **Comments:** Add comments explaining the purpose of functions, complex logic sections, and placeholder graphics.
3.  **Modularity:** Confirm that Scenes are reasonably self-contained and entity logic is encapsulated (in classes where applicable).
4.  **Basic Error Handling:** Implement basic checks where necessary (though extensive error handling might be out of scope for initial generation).

---

## 6. How to Use This Framework with an LLM

1.  **Provide Game Design Document (GDD):** Give the detailed GDD to the LLM.
2.  **Provide This Context Framework:** Supply this **ENTIRE** Markdown document (LLM Game Generation Knowledge Framework) to the LLM in the *same prompt* or as part of its system instructions/context.
3.  **Issue a Clear Instruction:** E.g., "Generate the Phaser 3 game code based on the provided Game Design Document, strictly following all instructions, steps, constraints, and focus areas detailed in the LLM Game Generation Knowledge Framework."
4.  The LLM should use the GDD for *what* to build and this Context Framework for *how* to structure the request and the code generation process, focusing on the specified areas and respecting the constraints (especially placeholders and no audio).

---