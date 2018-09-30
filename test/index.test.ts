import * as fs from 'fs';

import * as Benchmark from 'benchmark';

import benchmark, {
  buildHeader,
  buildRow,
  makeBundleLink,
  parseOptions
} from '../src';

import { IBenchmark, IBenchmarkResult } from '../src/benchmark';
import { Renderer } from '../src/renderers/renderer';
import { mockConsole } from './mock-console';

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

jest.setTimeout(120 * 1000);

test('parseOptions', () => {
  expect(
    parseOptions([['while', whileLoop], ['forEach', forEach]]).compare
  ).toEqual([['while', whileLoop], ['forEach', forEach]]);
});

const minimumOptions = {
  compare: []
};

describe('buildHeader', () => {
  test('should return default', () => {
    expect(buildHeader(minimumOptions)).toEqual([
      'NAME',
      'OPS/SEC',
      'RELATIVE MARGIN OF ERROR',
      'SAMPLE SIZE'
    ]);
  });

  test('should return bundle', () => {
    expect(buildHeader({ ...minimumOptions, bundle: true })).toEqual([
      'NAME',
      'OPS/SEC',
      'RELATIVE MARGIN OF ERROR',
      'SAMPLE SIZE',
      'BUNDLE SIZE'
    ]);
  });
});

describe('makeBundleLink', () => {
  test('should default to return just the size', () => {
    expect(
      makeBundleLink(
        { size: 12345, name: 'mock-package' },
        { ...minimumOptions, bundle: true }
      )
    ).toBe('12.35 kB');
  });

  test('should add link when set to "link"', () => {
    expect(
      makeBundleLink(
        { size: 12312345, name: 'mock-package' },
        { ...minimumOptions, bundle: 'link' }
      )
    ).toBe('12.31 MB (https://bundlephobia.com/result?p=mock-package)');
  });

  test('should add html link when set to "link" with html renderer', () => {
    expect(
      makeBundleLink(
        { size: 500, name: 'mock-package' },
        { ...minimumOptions, bundle: 'link', renderer: Renderer.html }
      )
    ).toBe(
      '<a href="https://bundlephobia.com/result?p=mock-package">500.00 Bytes</a>'
    );
  });

  test('should add md link when set to "link" with md renderer', () => {
    expect(
      makeBundleLink(
        { size: 500, name: 'mock-package' },
        { ...minimumOptions, bundle: 'link', renderer: Renderer.md }
      )
    ).toBe('[500.00 Bytes](https://bundlephobia.com/result?p=mock-package)');
  });
});

const fakeTarget = (name: string, hz: number, rme: number) =>
  ({
    abort: () => ({} as Benchmark),
    aborted: false,
    cancelled: false,
    clone: () => ({} as Benchmark),
    compare: () => 1,
    compiled: '',
    count: 1,
    cycles: 1,
    emit: () => undefined,
    error: new Error(),
    fn: () => undefined,
    hz,
    listeners: () => [() => undefined],
    name,
    off: () => ({} as Benchmark),
    on: () => ({} as Benchmark),
    reset: () => ({} as Benchmark),
    result: undefined,
    run: () => ({} as Benchmark),
    running: false,
    setup: () => ({} as Benchmark),
    stats: {
      deviation: 1,
      mean: 1,
      moe: 1,
      rme,
      sample: new Array(150),
      sem: 1,
      variance: 1
    },
    teardown: () => undefined,
    timeStamp: undefined,
    times: {
      cycle: 1,
      elapsed: 1,
      period: 1,
      timeStamp: 1
    },
    type: ''
  } as IBenchmark);

describe('buildRow', () => {
  test('should return default', async () => {
    const row = await buildRow(minimumOptions)(
      Object.assign(fakeTarget('fake', 21234, 0.6543), {
        currentTarget: [fakeTarget('other', 1234, 0.2504) as IBenchmark],
        target: fakeTarget('dlv@1.1.2', 123123123, 1.2004) as IBenchmark
      } as IBenchmarkResult)
    );

    expect(row).toEqual(['dlv@1.1.2', '123,123,123', '± 1.20%', 150]);
  });

  test('should return return bundle info', async () => {
    const row = await buildRow({ ...minimumOptions, bundle: true })(
      Object.assign(fakeTarget('fake', 21234, 0.6543), {
        currentTarget: [fakeTarget('other', 1234, 0.2504) as IBenchmark],
        target: fakeTarget('dlv@1.1.2', 123123123, 1.2004) as IBenchmark
      } as IBenchmarkResult)
    );

    expect(row).toEqual([
      'dlv@1.1.2',
      '123,123,123',
      '± 1.20%',
      150,
      '209.00 Bytes'
    ]);
  });
});

describe('perf table', () => {
  test('should error when no renderer found', async () => {
    expect.assertions(1);

    try {
      await benchmark({
        compare: [['while', whileLoop], ['forEach', forEach]],
        log: false,
        options: { minSamples: 10 },
        renderer: 'unknown'
      });
    } catch (e) {
      expect(e.message).toBe('Renderer not found.');
    }
  });

  test('should render CLI table', async () => {
    const result = await benchmark({
      compare: [['while', whileLoop], ['forEach', forEach]],
      log: false,
      options: { minSamples: 10 }
    });

    expect(result.indexOf('┼') > -1).toBe(true);
  });

  test('should render markdown table', async () => {
    const result = await benchmark({
      compare: [['forOf', forOf], ['for', forLoop]],
      log: false,
      options: { minSamples: 10 },
      renderer: Renderer.md
    });

    expect(result.indexOf('|') > -1).toBe(true);
    expect(result.indexOf('OPS/SEC') > -1).toBe(true);
  });

  test('should write to file', async () => {
    const file = 'test.md';

    await benchmark({
      compare: [['forOf', forOf], ['for', forLoop]],
      file,
      log: false,
      options: { minSamples: 10 },
      renderer: Renderer.md
    });

    expect(fs.existsSync(file)).toBe(true);
    fs.unlinkSync(file);
  });

  test('should reject with write errors', async () => {
    expect.assertions(1);

    try {
      const file = 'test';

      await benchmark({
        compare: [['forOf', forOf], ['for', forLoop]],
        file,
        log: false,
        options: { minSamples: 10 }
      });
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test('should log to the console', async () => {
    const { calls } = mockConsole();

    await benchmark({
      compare: [['forOf', forOf], ['for', forLoop]],
      options: { minSamples: 10 }
    });

    expect(calls[0][0].indexOf('┼') > -1).toBe(true);
  });

  test('should use custom render function', async () => {
    const renderer = jest.fn();

    await benchmark({
      compare: [['forOf', forOf], ['for', forLoop]],
      log: false,
      options: { minSamples: 10 },
      renderer
    });

    expect(renderer).toHaveBeenCalled();
    expect(Array.isArray(renderer.mock.calls[0][0])).toBe(true);
  });
});
