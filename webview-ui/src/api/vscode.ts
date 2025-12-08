export type WebviewMessage = {
  command: string;
  payload?: unknown;
};

type VSCodeApi = {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

// Declare the acquireVsCodeApi function that is available in the global scope of the webview
declare const acquireVsCodeApi: () => VSCodeApi;

class VSCodeWrapper {
  private readonly vsCodeApi: VSCodeApi | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === "function") {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  postMessage(message: unknown) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log("VS Code Message:", message);
    }
  }

  getState(): unknown {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    }
    return;
  }

  setState(state: unknown) {
    if (this.vsCodeApi) {
      this.vsCodeApi.setState(state);
    }
  }
}

export const vscode = new VSCodeWrapper();
