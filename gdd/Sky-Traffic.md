Sky Traffic Control LLM-Readable Game Design
Game Overview

Title: Sky Traffic Control
Genre: Puzzle, Attention-Based
Platform: Web (HTML5, JavaScript, p5.js)
Objective: Guide airplanes to matching landing strips by toggling flight path junctions, testing divided attention.
Target Audience: Casual gamers, ages 12+

Core Mechanics

Objective: Direct each airplane to its designated landing strip (matched by color/symbol). Prevent collisions or incorrect landings.
Gameplay Loop:
Planes spawn at screen edges, move toward landing strips.
Player clicks junction nodes to toggle flight paths.
Success: All planes land correctly to advance to next level.
Failure: Lose 1 life (of 3) for collisions or wrong landings. Game ends at 0 lives.


Controls:
Mouse click: Toggle junction nodes.
Keyboard 'P': Pause game.


Scoring:
100 points per correct landing.
+50 points for landings within 3 seconds (combo).
+200 points for error-free level.
High score saved in browser LocalStorage.



Game Elements

Airplanes:
Attributes: Color/symbol, speed, current path, destination strip.
Movement: Constant speed along flight paths, modified by weather.
Spawn: Randomized at screen edges.


Landing Strips:
Attributes: Fixed position, color/symbol matching planes.
Capacity: One plane at a time; clears after landing.


Junction Nodes:
Function: Click to toggle between 2–3 flight path routes.
Visual: Circle with arrows showing current route.


Weather Events:
Wind Gusts: Alter plane speed (±10%), 10% chance per level.
Fog: Obscure 20% screen for 5 seconds, 5% chance per level.
Limit: One event every 10 seconds.


Power-Ups:
Radar Boost: Slow planes by 50% for 5 seconds, spawns every 3 levels.
Clear Skies: Remove weather effects for 10 seconds, spawns every 5 levels.
Activation: Click floating icon.



Level Design



Level
Planes
Strips
Junctions
Features



1
1
1
1
Tutorial


5
3
3
4
Wind gusts


10
5
4
6
Fog, power-ups



Progression:
Every 5 levels: +1 plane or strip, +1–2 junctions, +2% weather event chance.



Visual and Audio Design

Visual Style:
Theme: Radar interface, dark green grid background.
Planes: Colored/symbol-marked icons (e.g., red triangle).
Strips: Rectangular, color/symbol-matched.
Junctions: White circles with animated arrows.
Animations: Smooth plane movement, flashing strips on landing, screen shake on collision.


Audio:
Background: Ambient electronic music.
Effects:
Click sound for junctions.
Radio chatter for spawns/landings.
Warning beep for errors.
Chime for level completion.





Technical Requirements

Engine: p5.js for 2D rendering and logic.
Canvas: 800x600 pixels, scalable.
Data Structures:
Planes: Array of objects (position, speed, destination).
Flight Paths: Graph of nodes and edges.
Strips: Array of objects (position, symbol).


Logic:
Movement: Update plane positions per frame.
Collision: Check plane overlaps or wrong landings.
Junctions: Toggle route on click.


Storage: LocalStorage for high scores, settings.
Performance: Target 60 FPS, optimize for low-end devices.

