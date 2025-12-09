import '@testing-library/jest-dom';

// Mock VSCode API for tests
declare global {
  // eslint-disable-next-line no-var
  var acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
}

globalThis.acquireVsCodeApi = () => ({
  postMessage: () => {},
  getState: () => ({}),
  setState: () => {}
});

