import { IRenderFunction } from './renderer';

const mapHTML = <T>(data: T[], template: (data: T) => string) =>
  data.map(value => template(value)).join('\n');

const renderHTML: IRenderFunction = data => `
  <table>
    <thead>
      <tr>
        ${mapHTML(data[0], title => `<th>${title}</th>`)}
      </tr>
    </thead>
    <tbody>
      ${mapHTML(
        data.slice(1),
        row => `
          <tr>
            ${mapHTML(row, item => `<td>${item}</td>`)}
          </tr>
        `
      )}
    </tbody>
  </table>
`;

export default renderHTML;
