import { Command } from "commander";

import { AbstractAction } from "../actions/abstract.action";

export interface Input {
  name: string;
  value: boolean | string;
  options?: any;
}

export abstract class AbstractCommand {
  protected constructor(protected action: AbstractAction) {}

  public abstract load(program: Command): void;
}
