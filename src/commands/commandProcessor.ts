import _ from "lodash";
import { Interface } from "readline";
import { CommandInfo } from "./commandInfo";
import { table } from 'table';

export interface TableOptions {
  columns: string[];
  customOptions?: any;
}

export abstract class CommandProcessor {
  private console: Interface;
  constructor(protected consoleInterface: Interface) {
    this.console = consoleInterface;
  }

  protected get Console(): Interface {
    return this.console;
  }

  protected get Prototype(): any {
    return CommandProcessor.prototype;
  }

  private generateHelp() {
    const thisArg: any = this;
    for (const member of Object.getOwnPropertyNames(this.Prototype)) {
      if (_.isFunction(thisArg[member]) && member.endsWith("Command")) {
        this.consoleInterface.write(`-- ${member.replace("Command", "")}\n`);
      }
    }
  }

  protected resolveArgument(argument: string, args: string) {
    let value = undefined;

    for (const argTuple of _.split(args, " ")) {
      if (argTuple.indexOf(argument) > -1) {
        const tupleElements = _.split(argTuple, "=");
        if (_.size(tupleElements) > 1) {
          value = tupleElements[1];
          break;
        } else {
          throw new Error(`Invalid argument: ${argTuple}`);
        }

      }
    }

    return value;
  }

  protected buildTable(rows: any[], tableOptions?: TableOptions): string {
    const tableSource = [];
    const availableColumns: string[] = Object.keys(_.first(rows));
    const selectedColumns = tableOptions && tableOptions.columns || availableColumns;
    const headerItem: string[] = _.filter<string>(availableColumns, (column: string) => _.indexOf(selectedColumns, column) > -1);
    tableSource.push(headerItem);
    const rowsSize = _.size(rows);
    for (let rowIndex = 1; rowIndex < rowsSize; rowIndex++) {
      tableSource.push(_.values(_.pick(rows[rowIndex], headerItem)));
    }
    return table(tableSource, tableOptions && tableOptions.customOptions);
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
        thisArg.console.write(`Unrecognized command: ${command}`);
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

  public helpCommand() {
    this.generateHelp();
  }
}
