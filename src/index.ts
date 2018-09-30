import * as Benchmark from 'benchmark';
import * as fileSize from 'file-size';
import * as fs from 'fs';
import fetch from 'node-fetch';
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

export function makeBundleLink(
  { size, name }: { size: number; name: string },
  options: IBenchmarkOptions
) {
  const bundleLink = `https://bundlephobia.com/result?p=${name}`;
  const readableSize = fileSize(size).human('si');

  let formattedLink: string;

  if (options.bundle === true) {
    return readableSize;
  }

  switch (options.renderer) {
    case Renderer.md:
      formattedLink = `[${readableSize}](${bundleLink})`;
      break;
    case Renderer.html:
      formattedLink = `<a href="${bundleLink}">${readableSize}</a>`;
      break;
    default:
      formattedLink = `${readableSize} (${bundleLink})`;
  }

  return formattedLink;
}

export const buildRow = (options: IBenchmarkOptions) => async (
  result: IBenchmarkResult
) => {
  const row = [
    result.target.name,
    result.target.hz.toLocaleString('en-US', { maximumFractionDigits: 0 }),
    `± ${result.target.stats.rme.toFixed(2)}%`,
    result.target.stats.sample.length
  ];

  if (options.bundle) {
    const test = await fetch(
      `https://bundlephobia.com/api/size?package=${result.target.name}`
    );
    const json = await test.json();

    row.push(makeBundleLink(json, options));
  }

  return row;
};

export function buildHeader(options: IBenchmarkOptions) {
  const header = ['NAME', 'OPS/SEC', 'RELATIVE MARGIN OF ERROR', 'SAMPLE SIZE'];

  if (options.bundle) {
    header.push('BUNDLE SIZE');
  }

  return header;
}

const initTableConfig = async (
  benchmarkResults: IBenchmarkResult[],
  options: IBenchmarkOptions
) => {
  const header = buildHeader(options);
  const rows = await Promise.all(benchmarkResults.map(buildRow(options)));

  return [header, ...rows];
};

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

  if (!benchmarkOptions.renderer) {
    benchmarkOptions.renderer = Renderer.cli;
  }

  return benchmarkOptions;
}

export default (
  rawOptions: IBenchmarkOptions | IComparisonList
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    const parsedOptions = parseOptions(rawOptions);
    const { compare, file, log, options, renderer } = parsedOptions;
    const renderFunction =
      typeof renderer === 'string' ? renderers[renderer] : renderer;

    if (!renderFunction) {
      return reject(new Error('Renderer not found.'));
    }

    const benchmark = new Benchmark.Suite('benchmark');
    const currentOptions = { ...defaultOptions, ...options };
    const results: IBenchmarkResult[] = [];

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
      .on('complete', async () => {
        const sorted = sortDescResults(results);
        const config = await initTableConfig(sorted, parsedOptions);
        const data = renderFunction(config);

        if (log === true || (log === undefined && !file)) {
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
