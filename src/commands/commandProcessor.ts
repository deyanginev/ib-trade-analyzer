import { O_APPEND } from "constants";
import _ from "lodash";
import { Interface } from "readline";
import { CommandInfo } from "./commandInfo";

export abstract class CommandProcessor {
  private console: Interface;
  constructor(protected consoleInterface: Interface) {
    this.console = consoleInterface;
  }

  protected get Console(): Interface {
    return this.console;
  }

  public get commandToken(): string | undefined {
    return undefined;
  }

  public get processorDescription(): string {
    return "";
  }

  public startListening() {
    const thisArg = this;
    this.console.question("", (command: string) => {
      const commandInfo = new CommandInfo(command);

      if (thisArg.handleCommand(commandInfo)) {
        thisArg.startListening();
      } else {
        thisArg.console.write("Unrecognized command.");
        thisArg.startListening();
      }
    });
  }

  public handleCommand(command: CommandInfo): boolean {
    if (this.canHandleCommand(command)) {
      this.executeCommand(command);
      return true;
    } else {
      const childProcessors = this.getChildProcessors();
      for (const processor of childProcessors) {
        if (processor.commandToken === command.Command) {
          if (processor.handleCommand(new CommandInfo(command.ArgsString))) {
            return true;
          }
        }
      }
      this.console.write(`Unrecognized command: ${command.Command}\n`);
      return false;
    }
  }

  protected abstract getChildProcessors(): CommandProcessor[];

  protected executeCommand(command: CommandInfo) {
    const thisArg: any = this;
    thisArg[`${command.Command}Command`](...command.Args);
  }

  private canHandleCommand(command: CommandInfo): boolean {
    const { Command: rootCommand } = command;
    if (!_.isUndefined(rootCommand)) {
      const thisArg: any = this;
      return _.isFunction(thisArg[`${rootCommand}Command`]);
    }
    return false;
  }
}
