import renderHTML from '../../src/renderers/html';

const data = [
  ['name', 'age', 'pizza topping'],
  ['burt', '40', 'anchovies'],
  ['gert', '35', 'pineapple'],
  ['john', '18', 'basil']
];

test('renderHTML', () => {
  expect(renderHTML(data)).toMatchSnapshot();
});
