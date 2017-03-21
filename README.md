# hello-space

A successful rocket controller for Reaktor's http://hellospace.reaktor.com/.

## Instructions

1. Install libraries by executing `npm update` in the command line.
1. Build the project by executing `npm run build`.
1. Copy the contents of the bundle file dist/go_to_moon.js, paste them into http://hellospace.reaktor.com/, and add line `return GoToMoon.goToMoon;`.
1. Launch!

The script to use at http://hellospace.reaktor.com/ should look like
```
// Bundle contents
var GoToMoon = ...
   ...
]);

// Add this manually
return GoToMoon.goToMoon;
```
