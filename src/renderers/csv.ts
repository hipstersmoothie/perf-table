import { IRenderFunction } from './types';

const renderCSV: IRenderFunction = data =>
  data.reduce((text, line) => text + `\n${line.join(',')}`, '');

export default renderCSV;
