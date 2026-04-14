declare namespace NodeJS {
  interface Process {
    [key: string]: any;
  }
}

type NonSharedArrayBufferView = ArrayBufferView;