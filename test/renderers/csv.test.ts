import renderCSV from '../../src/renderers/csv';

const data = [
  ['name', 'age', 'pizza topping'],
  ['burt', '40', 'anchovies'],
  ['gert', '35', 'pineapple'],
  ['john', '18', 'basil']
];

test('renderCSV', () => {
  expect(renderCSV(data)).toMatchSnapshot();
});
