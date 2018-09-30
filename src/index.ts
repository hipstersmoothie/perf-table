import * as Benchmark from 'benchmark';
import * as compose from 'compose-tiny';
import * as fs from 'fs';
import * as ora from 'ora';

import * as mdTable from 'markdown-table';
import { table } from 'table';
import renderCSV from './renderers/csv';
import renderHTML from './renderers/html';

import {
  IBenchmarkOptions,
  IBenchmarkResult,
  IComparisonList
} from './benchmark';
import { IRenderFunction, Renderer } from './renderers/renderer';

interface IRendererMap {
  [key: string]: IRenderFunction;
}

const renderers: IRendererMap = {
  [Renderer.md]: mdTable,
  [Renderer.cli]: table,
  [Renderer.csv]: renderCSV,
  [Renderer.html]: renderHTML
};

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

export function parseOptions(rawOptions: IBenchmarkOptions | IComparisonList) {
  let benchmarkOptions: IBenchmarkOptions;

  if (Array.isArray(rawOptions)) {
    benchmarkOptions = { compare: rawOptions } as IBenchmarkOptions;
  } else {
    benchmarkOptions = rawOptions;
  }

  return benchmarkOptions;
}

export default (
  rawOptions: IBenchmarkOptions | IComparisonList
): Promise<string> =>
  new Promise((resolve, reject) => {
    const {
      compare,
      file,
      log,
      options,
      renderer = Renderer.cli
    } = parseOptions(rawOptions);
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

    const setSpinner = (event: IBenchmarkResult) => {
      spinner = ora(`Running ${event.target.name} benchmark`);
      spinner.start();
    };

    compare.forEach(([packageName, packageRunner]) => {
      benchmark.add(packageName, packageRunner, currentOptions);
    });

    benchmark
      .on('start', setSpinner)
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

        setSpinner({
          target: event.currentTarget[index + 1]
        } as IBenchmarkResult);
      })
      .on('complete', () => {
        const data = renderTable(results);

        if (log || !file) {
          console.log(data);
        }

        if (!file) {
          spinner.stop();
          return resolve(data);
        }

        fs.writeFile(file, data, err => {
          if (err) {
            return reject(err);
          }

          spinner.succeed(`Successfully wrote performance results to: ${file}`);
          spinner.stop();
          resolve(data);
        });
      })
      .run({ async: true });
  });
