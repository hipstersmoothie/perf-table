import * as fs from 'fs';
import benchmark, { parseOptions } from '../src';
import { Renderer } from '../src/renderers/types';
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
});
