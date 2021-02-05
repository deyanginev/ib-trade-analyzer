import { Interface } from "readline";

export interface IConsole {
  write(data: string): void;
  writeLine(data: string): void;
  prompt(): void;
  setPrompt(data: string): void;
  addEventListener(event: string, callback: (data: string) => void): void;
  removeEventListener(event: string): void;
}

export class DefaultConsole implements IConsole {
  constructor(private console: Interface) {
    this.console.setMaxListeners(1);
  }

  public addEventListener(
    event: string,
    callback: (data: string) => void
  ): void {
    this.console.addListener(event, callback);
  }

  public removeEventListener(event: string): void {
    this.console.removeAllListeners(event);
  }

  public prompt(): void {
    this.console.prompt();
  }

  public setPrompt(data: string): void {
    this.console.setPrompt(data);
  }

  public write(data: string): void {
    console.log(data);
  }

  public writeLine(data: string): void {
    console.log(data);
  }
}
