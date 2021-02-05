import _ from "lodash";
import { CommandInfo } from "./commandInfo";
import { table } from "table";
import moment from "moment";
import { IConsole } from "../console/console";

const DEFAULT_DATE_FORMAT = "YYYY/MM/DD";

export interface TableOptions {
  columns: string[];
  dateFormat?: string;
  customOptions?: any;
}

export abstract class CommandProcessor {
  constructor(protected consoleInterface: IConsole) {
  
  }

  protected get Prototype(): any {
    return CommandProcessor.prototype;
  }

  protected abstract getHelp(command: string): string;

  private generateHelp() {
    const thisArg: any = this;
    for (const member of Object.getOwnPropertyNames(this.Prototype)) {
      if (_.isFunction(thisArg[member]) && member.endsWith("Command")) {
        const commandToken = member.replace("Command", "");
        this.consoleInterface.writeLine(
          `-- ${commandToken} - ${this.getHelp(commandToken)}`
        );
      }
    }
  }

  protected resolveArgument(
    argument: string,
    args: string
  ): string | undefined {
    let value = undefined;

    for (const argTuple of _.split(args, " ")) {
      if (argTuple.indexOf(argument) > -1) {
        const tupleElements = _.split(argTuple, ":");
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
    if (_.size(rows) > 0) {
      const availableColumns: string[] = Object.keys(_.first(rows));
      let selectedColumns = availableColumns;

      if (!_.isUndefined(tableOptions) && _.size(tableOptions.columns) > 0) {
        selectedColumns = tableOptions.columns;
      }

      const headerItem: string[] = _.filter<string>(
        availableColumns,
        (column: string) => _.indexOf(selectedColumns, column) > -1
      );
      tableSource.push(headerItem);
      const rowsSize = _.size(rows);
      for (let rowIndex = 0; rowIndex < rowsSize; rowIndex++) {
        const dataItem = _(rows[rowIndex])
          .pick(headerItem)
          .values()
          .map((rowValue) => {
            if (_.isDate(rowValue)) {
              return moment(rowValue).format(
                _.get(tableOptions, "dateFormat", DEFAULT_DATE_FORMAT)
              );
            }
            return rowValue;
          })
          .value();
        tableSource.push(dataItem);
      }
      return table(tableSource, tableOptions && tableOptions.customOptions);
    }

    return "No data";
  }

  public get commandToken(): string | undefined {
    return undefined;
  }

  public get processorDescription(): string {
    return "";
  }

  public start() {
    const thisArg = this;
    const commandCallback = (command: string) => {
      const commandInfo = new CommandInfo(command);

      try {
        if (thisArg.handle(commandInfo)) {
          this.consoleInterface.prompt();
        } else {
          thisArg.consoleInterface.writeLine(`Unrecognized command: ${command}`);
          this.consoleInterface.prompt();
        }
      } catch (e) {
        this.consoleInterface.write(`${e}\n`);
        this.consoleInterface.prompt();
      }
    };
    this.consoleInterface.addEventListener("line", commandCallback);
    this.consoleInterface.prompt();
  }

  public handle(command: CommandInfo): boolean {
    if (this.canHandle(command)) {
      this.execute(command);
      return true;
    } else {
      const childProcessors = this.getChildProcessors();
      for (const processor of childProcessors) {
        if (processor.commandToken === command.Command) {
          if (processor.handle(new CommandInfo(command.ArgsString))) {
            return true;
          }
        }
      }
      return false;
    }
  }

  protected abstract getChildProcessors(): CommandProcessor[];

  protected execute(command: CommandInfo) {
    const thisArg: any = this;
    thisArg[`${command.Command}Command`](command.ArgsString);
  }

  private canHandle(command: CommandInfo): boolean {
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
