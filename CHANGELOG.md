## v0.3.1

### Bug Fixes

- [#11](https://github.com/lukaswagner/lasso/pull/11): Properly implement undo/redo and fix appropriate docs.

## v0.3

### Features

-   [#5](https://github.com/lukaswagner/lasso/pull/5): Add visualization of drawn path.
-   [#8](https://github.com/lukaswagner/lasso/pull/8): Add image-based selection. This algorithm rasterizes the path and checks the points against the resulting image. Faster than normal polygon-based check for high point counts and path complexity. 
-   [#9](https://github.com/lukaswagner/lasso/pull/9): Add box-based check. Since box selections are axis-aligned bounding boxes, the selection check is much faster than converting to a path and using one of the other checks.

### Chores

-   [#6](https://github.com/lukaswagner/lasso/pull/6): Add documentation.

## v0.2

### Features

-   Add `setSelection` function.
