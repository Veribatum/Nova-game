# BLACKGLASS · A Rapscallion Story

A standalone third-person space RPG built in `Veribatum/Nova-game` from the BLACKGLASS setting. Play as Nova, independent captain of the Rapscallion.

**Play:** https://veribatum.github.io/Nova-game/

The opening build has five explorable areas: Rapscallion's crew deck and bridge, Wayfarer Anchorage, the UFD Kestrel Logistics installation, the Kharuun Ember Reach refinery, and the Peregrine survey wreck. Two main contracts and a repeatable salvage claim connect exploration, ground combat, evidence recovery, payment, gear, abilities, and reputation.

## Start playing

Choose **Take the helm**. Use the bridge navigation table or **JOBS** in the upper-right corner to accept **Paper Trail**. Read the briefing, deploy, secure the archive export beside the core, and return to the extraction airlock. Deliver it at Rapscallion's navigation table. This unlocks **Borrowed Fire**. **Dead Air** is an independent salvage alternative.

### Phone

Left stick moves relative to the camera. Drag the right side of the screen to look. Tap the contextual prompt to interact. Hold **FIRE**, tap **RUN** to sprint, **LOW** to crouch, **CLOAK** to spend energy, and **MED** to apply a kit. Reload using the arrow next to the ammo count. Switch weapons through **GEAR**.

### Computer

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Mouse drag | Look |
| Click / hold F | Fire |
| Right mouse button | Aim |
| Shift | Sprint |
| C | Crouch |
| Q | Cloak |
| E | Interact |
| R | Reload |
| H | Medkit |
| 1 / 2 | Weapon slots |
| J / Tab, M, I | Contracts, local map, loadout |
| Escape | Pause / close menu |

## Progress

The game saves automatically in the current browser under a new namespaced save key. **MENU → Export save** and **Import save** transfer a captain between devices. Saves do not automatically sync through GitHub. Rest at the ship's bunk for free health, standard ammunition, cloak energy, and a basic allowance of three medkits. A failed contract allows recovery aboard ship with objective progress preserved.

## Assets

Nova's existing uploaded GLB supplies her rig, materials, and idle/walk/run/crouch clips. The uploaded wall model supplies selected bulkheads. Other characters and environment pieces are provisional code-built art pending the owner's character and prop collection. The manifest is [`assets/catalog.json`](assets/catalog.json); see [asset integration](docs/ASSETS.md). No external CDN or API key is needed. Runtime dependencies are vendored locally.

## Local development

Requires Node 22+ for development checks. There are no npm package dependencies.

```sh
npm run check
npm test
npm run build
```

Serve the repository root or generated `dist/` over HTTP. Opening `index.html` as a local `file:` URL will not load ES modules and models. GitHub Pages serves the repository root with `.nojekyll`; the separate build is for local preview and portable static hosting.

## Validation and limits

Automated tests cover both chapter walkthroughs using the actual movement and interaction controller, route reachability for every area, collision and line of sight, exposed and blocked shots, enemy detection, reload and medkit timing, cloak, contract unlocks, duplicate-payment protection, choices, salvage reset, inventory costs, and save round trips.

The development browser in this session has WebGL explicitly disabled. It could load the actual model and run the controller/UI through a test-only renderer, and the menus were inspected, but the 3D renderer, final character appearance, visible animation, visual weapon grip, and device performance could not be verified there. Those remain a first-play validation item. No test renderer or QA page is included in the production build.

This is an opening RPG chapter, not the entire planned BLACKGLASS campaign. Travel uses a destination selection and jump transition; there is no manual spaceflight. Conversations are authored; no paid AI backend is connected. The supplied canonical lore files are unchanged.

## Source layout

- `src/game.js`: player, camera, combat, input, travel, interactions
- `src/world.js`: levels, props, population, collision, sight lines
- `src/actors.js`: animated GLB loading and provisional characters
- `src/state.js`: progression, inventory, contracts, versioned saves
- `src/content.js`: contracts, cast, equipment, discovered lore
- `src/ui.js`: menus, HUD, dialogue, map, touch interface
- `src/audio.js`: original synthesized ambience and effects

Three.js is MIT licensed; its notice is in `vendor/LICENSE-THREE.txt`. Existing repository assets are retained as owner-supplied assets.
