declare module "rrule" {
  export type RRuleSet = {
    between: (after: Date, before: Date, inc?: boolean) => Date[];
  };

  export function rrulestr(rrule: string, options?: { forceset?: boolean }): RRuleSet;
}