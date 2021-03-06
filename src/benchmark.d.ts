import * as Benchmark from 'benchmark';
import { IRenderFunction, Renderer } from './renderers/renderer';

interface IBenchmark extends Benchmark {
  name: string;
}

export interface IBenchmarkResult extends Benchmark.Event {
  currentTarget: IBenchmark[];
  target: IBenchmark;
}

type IBenchmarkFunction = () => void;

export type IComparisonList = [string, IBenchmarkFunction][];

export interface IBenchmarkOptions {
  compare: IComparisonList;
  file?: string;
  log?: boolean;
  bundle?: boolean | 'link';
  options?: Benchmark.Options;
  renderer?: Renderer | string | IRenderFunction;
}
