import * as Benchmark from 'benchmark';
import * as compose from 'compose-tiny';
import * as fs from 'fs';
import * as ora from 'ora';

// Table Renderers
import * as mdTable from 'markdown-table';
import { table } from 'table';

interface IBenchmark extends Benchmark {
  name: string;
}

interface IBenchmarkResult extends Benchmark.Event {
  currentTarget: IBenchmark[];
  target: IBenchmark;
}

type IBenchmarkFunction = () => void;

export const enum Renderer {
  cli = 'CLI',
  md = 'md'
}

interface IRendererMap {
  [key: string]: (data: (string | number)[][]) => string;
}

interface IBenchmarkOptions {
  compare: [string, IBenchmarkFunction][];
  file?: string;
  log?: boolean;
  options?: Benchmark.Options;
  renderer?: Renderer | string;
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

const sortDescResults = (benchmarkResults: IBenchmarkResult[]) =>
  benchmarkResults.sort((a, b) => (a.target.hz < b.target.hz ? 1 : -1));

const defaultOptions = { minSamples: 100 };

const renderers: IRendererMap = {
  [Renderer.md]: mdTable,
  [Renderer.cli]: table
};

export default ({
  compare,
  file,
  log = true,
  options,
  renderer = Renderer.cli
}: IBenchmarkOptions): Promise<string> =>
  new Promise((resolve, reject) => {
    const renderFunction = renderers[renderer];

    if (!renderFunction) {
      return reject(new Error('Renderer not found.'));
    }

    const benchmark = new Benchmark.Suite('benchmark');
    const currentOptions = { ...defaultOptions, ...options };
    const results: IBenchmarkResult[] = [];
    const renderTable = compose(
      renderFunction,
      initTableConfig,
      sortDescResults
    );

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
        const { name } = event.target;
        const index = Object.values(event.currentTarget).findIndex(
          t => t.name === name
        );

        results.push(event);
        spinner.succeed(name);

        if (!event.currentTarget[index + 1]) {
          return;
        }

        spinner = ora(
          `Running ${event.currentTarget[index + 1].name} benchmark`
        );
        spinner.start();
      })
      .on('complete', () => {
        spinner.stop();

        const data = renderTable(results);

        if (log) {
          console.log(data);
        }

        if (!file) {
          return resolve(data);
        }

        fs.writeFile(file, data, err => {
          if (err) {
            reject(err);
          } else {
            console.log(`Successfully wrote performance results to: ${file}`);
            resolve(data);
          }
        });
      })
      .run({ async: true });
  });
