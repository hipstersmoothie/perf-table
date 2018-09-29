declare module 'markdown-table' {
  type MarkdownTable = (data: any[]) => string;
  export const markdownTable: MarkdownTable;

  export = markdownTable;
}
