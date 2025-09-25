declare module 'rrule' {
  export type RRuleSet = any;
  export function rrulestr(input: string, options?: Record<string, unknown>): RRuleSet;
}
