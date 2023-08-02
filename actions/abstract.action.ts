import { Input } from "../commands/abstract.command";

export abstract class AbstractAction {
  public abstract handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void>;
}
