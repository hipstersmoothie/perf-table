export const enum Renderer {
  cli = 'CLI',
  md = 'md',
  html = 'html',
  csv = 'csv'
}

export type IDataRow = (string | number)[];
export type IRenderFunction = (data: IDataRow[]) => string;
