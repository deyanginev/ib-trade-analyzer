import { CommandProcessor } from "./commandProcessor";
import { parse, eval } from "expression-eval";
import _ from "lodash";
import { IConsole } from "../console/console";

export const REPORT_TOKEN = "trades";

export default class TradesCommandProcessor extends CommandProcessor {
  constructor(console: IConsole, private data: Array<any>) {
    super(console);
  }

  protected get Prototype(): any {
    return TradesCommandProcessor.prototype;
  }

  public get commandToken() {
    return REPORT_TOKEN;
  }

  public get processorDescription() {
    return `Performs various operations on the ${this.commandToken} table.`;
  }

  protected getHelp(command: string): string {
    switch (command) {
      case "listColumns":
        return "lists the data properties available for a trade entry";
      case "list":
        return "lists trade entries based on selected columns and applied filters";
      default:
        return "";
    }
  }

  protected getChildProcessors(): CommandProcessor[] {
    return [];
  }

  private processFilters(data: Array<any>, filterString?: string): any[] {
    let dataWrapper = _(data);
    if (filterString) {
      const filterExpression = parse(filterString);
      dataWrapper = dataWrapper.filter((dataItem) =>
        eval(filterExpression, dataItem)
      );
    }

    return dataWrapper.value();
  }

  public listColumnsCommand() {
    const keys = Object.keys(this.data[0]);
    let tableColumns = "";
    for (const key of keys) {
      tableColumns += `* ${key}\n`;
    }

    this.consoleInterface.write(tableColumns);
  }

  public listCommand(args: string) {
    const filtersString = this.resolveArgument("-filter", args);
    const filteredData = this.processFilters(this.data, filtersString);
    const columnsArg = this.resolveArgument("-columns", args);
    const dateFormat = this.resolveArgument("-dateFormat", args);
    const columnsArray = (columnsArg && _.split(columnsArg, ",")) || [];
    this.consoleInterface.write(
      this.buildTable(filteredData, { columns: columnsArray, dateFormat })
    );
  }

  public listTradesCommand(args: string) {
    const columnsArg = this.resolveArgument("-columns", args);
    const columnsArray = (columnsArg && _.split(columnsArg, ",")) || [
      "symbol",
      "proceeds",
      "datadiscriminator",
      "datetime",
      "basis",
      "realizedpl",
      "quantity",
      "currency",
    ];
    const dateFormat = this.resolveArgument("-dateFormat", args);
    const filterString = this.resolveArgument("-filter", args);

    const filteredData = this.processFilters(this.data, filterString);

    const groups = _(filteredData).groupBy("symbol").value();
    this.consoleInterface.printGroups(
      groups,
      (groupKey: string) => `TRADES FOR SYMBOL: ${groupKey}`,
      (groupItems: Array<any>) =>
        this.buildTable(groupItems, { columns: columnsArray, dateFormat })
    );
  }
}
