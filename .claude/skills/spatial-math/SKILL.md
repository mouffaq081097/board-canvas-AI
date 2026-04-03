---
name: spatial-math
description: Logic for infinite canvas geometry, Bezier curves, and rotation snapping.
---
When calculating arrow paths, use the mid-point of the closest bounding-box edge.
For 360° rotation, apply a 15° snap when the user is within 3° of a multiple of 15.
All coordinates must be transformed via the Zustand 'zoom' and 'offset' state.