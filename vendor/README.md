# Three.js r160

Unmodified Three.js 0.160.0 ES module, downloaded 2026-10-22 from the versioned npm distribution via jsDelivr:

- https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
- https://cdn.jsdelivr.net/npm/three@0.160.0/LICENSE

MIT license: THREE-LICENSE.txt. Used locally so the exhibition does not depend on an external module request.

SVGLoader-r160.js is the unmodified loader from the same Three.js release, under the same MIT license:
https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/SVGLoader.js

## Local face tracking runtime

mediapipe/ contains @mediapipe/tasks-vision 0.10.14, obtained 2026-10-22 from the versioned npm package via https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/ : vision_bundle.mjs, package.json and the SIMD/no-SIMD WASM runtime files. Apache-2.0 license is retained in mediapipe/LICENSE.txt. Model provenance is in ../assets/models/ATTRIBUTION.md.

This runtime is imported only after the user explicitly starts camera try-on. Frames are processed locally. Existing MediaPipe Hands retains its previous on-demand network loading; it is separate from this local face runtime and shares an exclusive camera lease.
