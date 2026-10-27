# Character and prop integration

The existing Nova model and wall asset are used directly. Nothing in the supplied lore documents was overwritten.

## Send assets

A ZIP containing the available GLB, FBX, textures, and any animation libraries is suitable. Keep file names. GLB with embedded materials is easiest to load on the web, but FBX can be converted during the developer's integration pass. A rigged character without embedded clips is a rig, not proof that its animations have been mapped; inspect it before promising a working result.

The owner does not need to prepare an individual animation-upload project. The developer should inspect existing clips, map or retarget compatible source libraries, and validate the result visibly. Sharing Mixamo bone names alone does not establish identical rest transforms.

## Catalog

`assets/catalog.json` maps role names to actual files. Current character roles are `nova`, `human`, `vyraen`, `kharuun`, and `keshar`; `kharuunHeavy` is an optional override for the heavy. A null entry deliberately uses the provisional procedural actor.

```json
{
  "url": "./assets/models/characters/example.glb",
  "height": 1.82,
  "rotationY": 0,
  "animations": {
    "idle": "Idle",
    "walk": "Walk",
    "run": "run",
    "crouchIdle": "Crouch_Idle",
    "crouchWalk": "crouch_walk"
  }
}
```

The loader preserves the imported skeleton and bind matrices, clones animated characters with SkeletonUtils, samples the idle pose before normalizing the visual wrapper, and blends the mapped clips. It prevents existing Nova root motion from carrying the mesh away from the collision controller. It also recognizes common embedded clip names. It does not silently assume a different rig can use Nova's raw tracks.

World collision is independent of render meshes. Imported bulkheads are fit into selected wall slots; generated wall collision remains. New prop types can use `AssetBank.prop()` and replace the corresponding environment factory. The extra null prop names reserve intended integration categories; only `bulkhead` currently has a supplied file and a placement path.

## Check an asset in motion

Verify neutral pose, visible walk/run/crouch, forward direction, feet on the floor, transitions, tight camera view, and gun/hand relationship. Then check nearby cover and collision. Log any limitation. A playing mixer or changing bone quaternion does not establish visual success.

Retain source/provenance and any third-party license notices alongside imports. The current original game files remain recoverable in Git history at commit `8009cfa55343475c53a0e119ace026fad6386026`.
