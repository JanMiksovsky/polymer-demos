This repository contains demos of Elix mixins applied to Polymer elements.

# Install

Since Polymer 2.0's preview release and the polyfills seem to prefer being
installed by Bower, you need to use Yarn _and_ Bower -- in that order.

1. `yarn`
2. `bower install`
3. Hack the installed Elix installed in node_modules.

  It's currently very hard to get ES6, Polymer 2.0, and v1 polyfills to
  play nice together. For now, this project uses Babel only to process `import`
  statements. The rest of the ES6 is *not* transpiled, but run as is. The use of
  the real `class` syntax seems to let everything work more easily. However, the
  Elix package currently has a `.babelrc` that forces full ES2015 transpilation.
  To override that, you need to find `node_modules\elix\.babelrc`, and change
  the line that reads

  `"presets": ["es2015"]`

  and replace that with

    `"plugins": ["transform-es2015-modules-commonjs"]`

4. `yarn run build`

You should then be able to open index.html.
