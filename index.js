const fs = require('fs');
const ora = require('ora');
const Benchmark = require('benchmark');
const log = require('logdown');
const { table } = require('table');
const mdTable = require('markdown-table');

const initTableConfig = benchmarkResults => ({
  head: ['NAME', 'OPS/SEC', 'RELATIVE MARGIN OF ERROR', 'SAMPLE SIZE'],
  rows: benchmarkResults.map(result => [
    result.target.name,
    result.target.hz.toLocaleString('en-US', { maximumFractionDigits: 0 }),
    `± ${result.target.stats.rme.toFixed(2)}%`,
    result.target.stats.sample.length
  ])
});

function cliTable({ head, rows }) {
  return table([head, ...rows]);
}

function markdownTable({ head, rows }) {
  return mdTable([head, ...rows]);
}

function sortDescResults(benchmarkResults) {
  return benchmarkResults.sort((a, b) => (a.target.hz < b.target.hz ? 1 : -1));
}

const defaultOptions = { minSamples: 100, renderer: 'cli' };

function benchmarkPackage({ name, compare = [], options = {}, file }) {
  const benchmarkName = name || 'benchmark';
  const benchmark = new Benchmark.Suite(benchmarkName);
  const debug = log(benchmarkName);
  const currentOptions = { ...defaultOptions, ...options };
  const results = [];

  let spinner;

  compare.forEach(([packageName, packageRunner]) => {
    benchmark.add(packageName, packageRunner, currentOptions);
  });

  benchmark
    .on('start', event => {
      spinner = ora(`Running ${event.target.name} benchmark`);
      spinner.start();
    })
    .on('cycle', event => {
      const { name } = event.target;
      const index = Object.values(event.currentTarget).findIndex(
        t => t.name === name
      );

      results.push(event);
      spinner.succeed(name);

      if (event.currentTarget[index + 1]) {
        spinner = ora(
          `Running ${event.currentTarget[index + 1].name} benchmark`
        );
        spinner.start();
      }
    })
    .on('complete', () => {
      spinner.stop();
      debug.log();

      const sorted = sortDescResults(results);
      const config = initTableConfig(sorted);
      const renderer = currentOptions.renderer.toLowerCase();
      let data;

      if (renderer === 'cli') {
        data = cliTable(config);
      } else if (renderer === 'md' || renderer === 'markdown') {
        data = markdownTable(config);
      }

      if (data) {
        if (file) {
          fs.writeFile(file, data, (err, res) => {
            if (err) {
              console.log(err);
            } else {
              console.log(`Successfully wrote performance results to: ${file}`);
            }
          });
        } else {
          console.log(data);
        }
      }
    })
    .run({ async: true });
}

module.exports = benchmarkPackage;
