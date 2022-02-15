# lasso

Lasso and box select utility for 3D points on a 2D screen. Supports undo and redo.

## usage

### full example

See [demo/index.ts](./demo/index.ts) for a full example.

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
// start watching for freeform selection - pass 'box' for box selection
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

### type of returned selection

There are four options for the type of the selection given to the callback or accessed by calling `.selection()`. This defaults to `intArray` and can be configured using the returnType option.

- `booleanArray`: Array of booleans, mapping each index to whether the point is selected. May use more than 1 byte per boolean due to aligning all contained values to 4 or 8 bytes.
- `byteArray`: An `Uint8Array`, mapping each index to either 0 or 1, where 1 means the point is selected. Guaranteed memory consumption of 1 byte per index. Also, since you're probably using WebGL to render your 3D points, you can directly use this as an vertex attribute.
- `bitArray`: Most compact map option. Stores each point's selection state in a single bit.
- `indexSet`: Set of indices of selected points.
- `pointsSet`: Set of selected points.
