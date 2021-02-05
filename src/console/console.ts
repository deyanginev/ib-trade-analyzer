import { Interface } from "readline";

export interface IConsole {
    write(data: string): void;
    prompt(data: string, callback: (response: string) => void): void;
}

export class DefaultConsole implements IConsole {

    constructor(private console: Interface) {

    }

    public write(data: string): void {
        this.console.write(data);
    }

    public prompt(data: string, callback: (response: string) => void): void {
        this.console.question(data, callback);
    }
}