import { Interface } from "readline";
import { CommandProcessor } from "./commandProcessor";
import { parse, eval } from "expression-eval";
import _ from "lodash";

export const REPORT_TOKEN = "trades";

export default class TradesCommandProcessor extends CommandProcessor {
  constructor(console: Interface, private data: Array<any>) {
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

  private processFilters(args: string): any[] {
    const filtersArg = this.resolveArgument("-filter", args);
    let dataWrapper = _(this.data);
    if (filtersArg) {
      const filterExpressions = filtersArg.split(",");
      for (const expression of filterExpressions) {
        const parsedExpression = parse(expression);
        dataWrapper = dataWrapper.filter((dataItem) =>
          eval(parsedExpression, dataItem)
        );
      }
    }

    return dataWrapper.value();
  }

  public listColumnsCommand() {
    const keys = Object.keys(this.data[0]);
    let tableColumns = "";
    for (const key of keys) {
      tableColumns += `* ${key}\n`;
    }

    this.Console.write(tableColumns);
  }

  public listCommand(args: string) {
    const filteredData = this.processFilters(args);
    const columnsArg = this.resolveArgument("-columns", args);
    const dateFormat = this.resolveArgument("-dateFormat", args);
    const columnsArray = (columnsArg && _.split(columnsArg, ",")) || [];
    this.Console.write(
      this.buildTable(filteredData, { columns: columnsArray, dateFormat })
    );
  }

  public listTradesCommand(args: string) {
    const columnsArg = this.resolveArgument("-columns", args);
    const columnsArray = (columnsArg && _.split(columnsArg, ",")) || ['symbol', 'proceeds', 'datadiscriminator', 'datetime', 'basis', 'realizedpl'];
    const dateFormat = this.resolveArgument("-dateFormat", args);
    const data = _(this.data)
      // we filter out rows representing a trade
      .filter(
        (item: any) =>
          item.header === "Data" &&
          (item.datadiscriminator === "Trade" ||
            item.datadiscriminator === "ClosedLot")
      )
      // we filter out sold positions and their corresponding lots; in this case quantity is a negative number
      .filter((item: any) => item.datadiscriminator === "Trade" && item.quantity < 0 || item.datadiscriminator === "ClosedLot")
      .groupBy("symbol")
      .forOwn((value: any[], key: string) => {
        this.Console.write(`TRADES FOR SYMBOL: ${key}\n`);
        this.Console.write(
          this.buildTable(value, { columns: columnsArray, dateFormat })
        );
      });
  }
}
