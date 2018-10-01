<div align="center">
  <img width="200" height="200"
    src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/129/mantelpiece-clock_1f570.png">
  <h1>perf-table</h1>
  <p>Compare the performance of functions.</p>
</div

[![CircleCI](https://img.shields.io/circleci/project/github/hipstersmoothie/perf-table/master.svg?style=for-the-badge)](https://circleci.com/gh/hipstersmoothie/perf-table/tree/master) [![Codecov](https://img.shields.io/codecov/c/github/hipstersmoothie/perf-table.svg?style=for-the-badge)](https://codecov.io/gh/hipstersmoothie/perf-table) [![npm](https://img.shields.io/npm/v/perf-table.svg?style=for-the-badge)](https://www.npmjs.com/package/perf-table) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge)](https://github.com/prettier/prettier)

Easily create a table comparing the performance of different functions. Useful for comparing npm packages and different implementations.

## Install

```
npm i --save-dev perf-table
```

## Usage

To use `perf-table` simply provide and array of testing tuples. Each testing tuple should have a name or npm package name as it's first member and a function to run as it's second.

The following example tests the perf differences between looping strategies.

```js
const data = new Array(45).fill(100);

function forLoop() {
  let result = 1;

  for (let i = 0; i < data.length; i++) {
    result *= result + data[i];
  }
}

function forOf() {
  let result = 1;

  for (const item of data) {
    result *= result + item;
  }
}

function whileLoop() {
  let result = 1;
  let i = 0;

  while (i < data.length) {
    result *= result + data[i++];
  }
}

function forEach() {
  let result = 1;

  data.forEach(item => {
    result *= result + item;
  });
}

// Table is a promise that resolve when done printing/writing the table.
// Resolves with formatted table
const data = await table([
  ['for', forLoop],
  ['for of', forOf],
  ['while', whileLoop],
  ['forEach', forEach]
]);
```

OUTPUT:

```sh
╔═════════╤════════════╤══════════════════════════╤═════════════╗
║ NAME    │ OPS/SEC    │ RELATIVE MARGIN OF ERROR │ SAMPLE SIZE ║
╟─────────┼────────────┼──────────────────────────┼─────────────╢
║ for     │ 11,251,638 │ ± 0.71%                  │ 186         ║
╟─────────┼────────────┼──────────────────────────┼─────────────╢
║ while   │ 10,804,607 │ ± 1.75%                  │ 185         ║
╟─────────┼────────────┼──────────────────────────┼─────────────╢
║ for of  │ 7,223,835  │ ± 1.17%                  │ 167         ║
╟─────────┼────────────┼──────────────────────────┼─────────────╢
║ forEach │ 4,146,640  │ ± 1.72%                  │ 183         ║
╚═════════╧════════════╧══════════════════════════╧═════════════╝
```

### Providing Tuples with other configuration

If you want to configure the table further you will have to put the array demonstrated above in the `compare` key of your options.

```js
table({
  compare: [
    ['for', forLoop],
    ['for of', forOf],
    ['while', whileLoop],
    ['forEach', forEach]
  ],
  ...
});
```

### Benchmark Options

`perf-table` is on top of [benchmark.js](https://benchmarkjs.com) and you can configure the each comparison run with [benchmark.js options](https://benchmarkjs.com/docs#options).

```js
table({
  compare: [ ... ],
  options: {
    minSamples: 500
  }
});
```

### Output Modes

`perf-table` comes with a few output modes pre configured.

- cli (default) - output a table formatted for the CLI
- md - output a markdown table
- html - output a html table
- csv - output the table data in csv

```js
table({
  compare: [ ... ],
  renderer: 'html'
})
```

### Custom Renderer

If you want to control how the table renders, pass a function to `renderer` and this will be used to render the perf table data.

```js
const renderCSV: IRenderFunction = data =>
  data.reduce((text, line) => text + `\n${line.join(',')}`, '');

table({
  compare: [ ... ],
  renderer: renderCSV
})
```

### Writing to a file

By default `perf-table` just prints the table to the console. If you provide a file path in the `file` option the table output will be written to that path.

```js
table({
  compare: [ ... ],
  file: 'test.txt'
})
```

### Force Logging

When the `file` option is provided the table will not be logged to the console. To override this behavior also pass `log: true`.

```js
table({
  compare: [ ... ],
  file: 'test.txt',
  log: true
})
```

### BundlePhobia Stats

You can display [bundlePhobia](https://bundlephobia.com/) column with your perf table to really compare yourself against the competition.

```js
table({
  compare: [ ... ],
  bundle: true
})
```

#### Link

To add a link the to [bundlePhobia](https://bundlephobia.com/) output set `bundle` to `'link'`.

```js
table({
  compare: [ ... ],
  bundle: 'link'
})
```
