import * as Benchmark from 'benchmark';
import * as fs from 'fs';
import * as ora from 'ora';

// Table Renderers
import mdTable from 'markdown-table';
import { table } from 'table';

interface IBenchmark extends Benchmark {
  name: string;
}

interface IBenchmarkResult extends Benchmark.Event {
  currentTarget: IBenchmark[];
  target: IBenchmark;
}

interface IBenchmarkOptions {
  name: string;
  compare: string[];
  options: any;
  file: string;
}

const initTableConfig = (benchmarkResults: IBenchmarkResult[]) => [
  ['NAME', 'OPS/SEC', 'RELATIVE MARGIN OF ERROR', 'SAMPLE SIZE'],
  ...benchmarkResults.map(result => [
    result.target.name,
    result.target.hz.toLocaleString('en-US', { maximumFractionDigits: 0 }),
    `± ${result.target.stats.rme.toFixed(2)}%`,
    result.target.stats.sample.length
  ])
];

function sortDescResults(benchmarkResults: IBenchmarkResult[]) {
  return benchmarkResults.sort((a, b) => (a.target.hz < b.target.hz ? 1 : -1));
}

const defaultOptions = { minSamples: 100, renderer: 'cli' };

export = ({ name, compare = [], options = {}, file }: IBenchmarkOptions) => {
  const benchmarkName = 'benchmark';
  const benchmark = new Benchmark.Suite(benchmarkName);
  const currentOptions = { ...defaultOptions, ...options };
  const results: IBenchmarkResult[] = [];

  let spinner = ora();

  compare.forEach(([packageName, packageRunner]) => {
    benchmark.add(packageName, packageRunner, currentOptions);
  });

  benchmark
    .on('start', (event: IBenchmarkResult) => {
      spinner = ora(`Running ${event.target.name} benchmark`);
      spinner.start();
    })
    .on('cycle', (event: IBenchmarkResult) => {
      const { name: testName } = event.target;
      const index = Object.values(event.currentTarget).findIndex(
        t => t.name === testName
      );

      results.push(event);
      spinner.succeed(name);

      if (!event.currentTarget[index + 1]) {
        return;
      }

      spinner = ora(`Running ${event.currentTarget[index + 1].name} benchmark`);
      spinner.start();
    })
    .on('complete', () => {
      spinner.stop();

      const sorted = sortDescResults(results);
      const config = initTableConfig(sorted);
      const renderer = currentOptions.renderer.toLowerCase();
      let data;

      if (renderer === 'cli') {
        data = table(config);
      } else if (renderer === 'md' || renderer === 'markdown') {
        data = mdTable(config);
      }

      if (!data) {
        return;
      }

      if (!file) {
        return console.log(data);
      }

      fs.writeFile(file, data, err => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Successfully wrote performance results to: ${file}`);
        }
      });
    })
    .run({ async: true });
};
