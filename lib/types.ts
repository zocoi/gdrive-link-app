import type { AppProps as LinktreeLinkAppContext } from "@linktr.ee/linkapp/types";

export type Stat = {
  name: string;
  value: string;
};

export type AppProps = LinktreeLinkAppContext & {
  // Stats array
  statsList?: Stat[];
};
