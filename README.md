# lasso

## usage

### minimal example

Minimal usage example for selecting 3D points with integrated mouse event handling. Note that all configuration options can be either set in the constructor (e.g. `new Lasso({target})`), via function (`lasso.setTarget`) or via property (`lasso.target`).

```ts
// create lasso instance
const lasso = new Lasso();
// set element to listen for mouse events on
lasso.target = document.getElementById('canvas');
// set 3D point source (must implement `at(number): vec3` and `length: number`)
lasso.points = myVec3Array;
// set callback to call if selection changes
lasso.callback = (sel) => console.log('selection changed');
// tell lasso how to map 3D points to screen
lasso.matrix = myViewProjectionMat4;
// start watching for freeform selection - pass 'rect' for box selection
lasso.enable();
```

### handling mouse events yourself

If needed, you can skip the included mouse event handling and pass in paths or rectangles directly. If a callback is set, it will be invoked. Otherwise, you can fetch the selection manually.

```ts
// create and configure lasso instance
const lasso = new Lasso({points, matrix});
// add to selection
lasso.add(myPath);
// fetch selection
const s = lasso.selection();
```
