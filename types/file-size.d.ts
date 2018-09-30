declare module 'file-size' {
  interface FileSize {
    human(mode: string): string;
  }

  type FileSizeFN = (data: number) => FileSize;
  export const fileSize: FileSizeFN;

  export = fileSize;
}
