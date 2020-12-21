import { Interface } from "readline";
import { CommandProcessor } from "./commandProcessor";
import _ from 'lodash';

export const REPORT_TOKEN = "trades";

export default class TradesCommandProcessor extends CommandProcessor {
  constructor(
    console: Interface,
    private key: string,
    private data: Array<any>
  ) {
    super(console);
  }

  protected get Prototype(): any {
    return TradesCommandProcessor.prototype;
  }

  protected getChildProcessors(): CommandProcessor[] {
    return [];
  }

  public listColumnsCommand() {
    this.Console.write(this.buildTable([this.data[0]]));
  }

  public listAllCommand(args: string) {
    const columnsArg = this.resolveArgument("-columns", args);
    const columnsArray = _.split(columnsArg, ",");
    this.Console.write(this.buildTable(this.data, { columns: columnsArray }));
  }

  public listBuysCommand() { }

  public get commandToken() {
    return REPORT_TOKEN;
  }

  public get processorDescription() {
    return `Performs various operations on the ${this.commandToken} table.`;
  }
}
