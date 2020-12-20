import { Interface } from "readline";
import { CommandProcessor } from "./commandProcessor";
import asTable from "as-table";

export const REPORT_TOKEN = "trades";

export default class TradesCommandProcessor extends CommandProcessor {
  constructor(
    console: Interface,
    private key: string,
    private data: Array<any>
  ) {
    super(console);
  }

  protected getChildProcessors(): CommandProcessor[] {
    return [];
  }

  public listAllCommand() {
    this.Console.write(asTable.configure({maxTotalWidth: 8, delimiter: '|'})(this.data));
  }

  public listBuysCommand() {}

  public get commandToken() {
    return REPORT_TOKEN;
  }

  public get processorDescription() {
    return `Performs various operations on the ${this.commandToken} table.`;
  }
}
