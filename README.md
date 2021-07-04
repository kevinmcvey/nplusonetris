# (N+1)Tris
[kevin.4mcveys.com/nplusonetris](http://kevin.4mcveys.com/nplusonetris/) · A game by Kevin McVey

It's Tetris but every line you clear makes the pieces bigger.

_The best game you've ever played or your money back!_

---

### Development
This project was built on a pretty old version of NodeJS (v12.16.1) and Grunt (v0.4.5). Maybe it'll work with newer versions too? Regardless, building should be relatively straightforward:

```
npm install
npm run build
```

The built project will be found in dist/build.js. There are no real dependencies, it's all vanilla.

Open up `index.html` in a web browser to see the game.

#### Auto-builds

If you're doing some heavier development, try `npm run build:watch`. It will re-build the project on file saves
and allow you to have quicker feedback in the browser. Refresh the browser page to see the new build.
