// Форма снимка system/generated/snapshot.json — то, что витрина из него читает.

export type Level = "draft" | "ready" | "stable";
export type Result = "pass" | "fail" | "pending";
export type Who = "машина" | "компонент" | "человек" | "совет" | "не указано";
export type Prop = { name: string; type: string; required: boolean; doc: string; kind: string; options?: string[]; default?: unknown; empty?: "null" | "undefined" };
export type Check = { id: string; label: string; level: "ready" | "stable"; result: Result; note: string | null };
export type Rule = { id: string; title: string; text: string; why: string | null; checkedBy: Who };
export type Grade = "patch" | "minor" | "breaking";
export type Change = { component: string; what: string; type: string; grade: { figma: Grade; code: Grade }; detail: string | null };
export type RuleNode = { c: string; p: Record<string, unknown>; t?: string };
export type RuleExample = { caption: string; nodes: RuleNode[] } | null;

export type Component = {
  name: string; slug: string; group: string; description: string; design: string;
  guidance: { do: string[]; dont: string[] } | null;
  behaviour: string[]; accessibility: string | null; codegen: string[];
  examples: { title: string; props: Record<string, unknown>; children?: unknown; trigger?: { label: string; props: Record<string, unknown> } }[];
  ruleExamples: Record<string, { do?: RuleExample; dont?: RuleExample }>;
  strings: string[];
  files: { component: string; styles: string | null; meta: string };
  props: Prop[];
  api: { shape: string; open: string[]; inlineStyles: { line: number }[] };
  tokens: { used: string[]; violations: { line: number; kind: string; text: string; why: string; file: string }[] };
  builtFrom: string[]; brings: string[]; usedIn: string[];
  usage: { direct: number; files: { file: string; count: number }[]; screens: string[]; screensIndirect: string[] };
  impact: { components: string[]; screens: string[] };
  contract: { path: string; status: string; depth: string; reviewed: string | null; summary: string | null; blind: string[]; rules: Rule[] } | null;
  maturity: { level: Level; checks: Check[]; missing: string[] };
};
export type Screen = { slug: string; key: string; name: string; route: string; file: string; product: string; pattern?: string; brand: string; files: string[]; components: Record<string, number>; indirect: Record<string, number> };
export type Brand = {
  id: string; name: string; status: string; tagline: string; about: string; audience: string; language: string;
  products: string[]; docs: { file: string; title: string }[];
  strings: { key: string; value: string; base: string | null; valid: boolean; components: string[] }[];
  tokenOverrides: { key: string; value: string }[]; affected: string[]; problems: string[];
  illustrations: { slot: string; file: string | null; usedIn: string[] }[];
};
export type Product = { id: string; name: string; brand: string; url: string | null; description: string; dir: string; cover: string | null; screens: string[] };
export type Pattern = { slug: string; file: string; title: string; when: string | null; example: string | null; components: string[]; steps: string[]; dont: string[]; screens: string[] };
export type Snapshot = {
  generated: string;
  totals: { components: number; levels: Record<Level, number>; contracts: number; screens: number; semanticTokens: number; brands: number; tokenViolations: number; openApi: string[] };
  lint: { date: string; fresh: number; frozen: number; unknown: number } | null;
  usageScan: { files: number; roots: string[]; blind: Record<string, unknown[]> };
  components: Component[];
  brandDependentTokens: string[];
  baseStrings: Record<string, string>;
  illustrationSlots: Record<string, string>;
  brands: Brand[];
  patterns: Pattern[];
  patternProblems: string[];
  products: Product[];
  screens: Screen[];
  tokenUse: Record<string, string[]>;
  candidates: { id: string; file: string; title: string; state: string; where: string | null; builtFrom: string | null }[];
  history: { date: string; changes: Change[] }[];
  productHistory: { date: string; changes: { screen: string; product?: string; what: string; components: string[] }[] }[];
};
export type Finding = { rule: string; component: string | null; product: string | null; level?: "core" | "brand" | "product"; file: string; line: number; message: string; state: "fresh" | "frozen" };
export type CodeRule = { id: string; level: "core" | "brand" | "product"; scope: string; file: string; kind: string; title: string; why: string; addedBy: string; since: string; message: string };
export type TypeCheck = { date: string; projects: { project: string; ok: boolean; errors: string[] }[] };
export type LintReport = {
  date: string; fresh: number; frozen: number; unknown: number; rulesRun: number; files: number;
  rules: { id: string; component: string; kind: string; anchor: { section: string; quote: string } }[];
  codeRules: CodeRule[];
  findings: Finding[]; notChecked: { rule: string; component: string; product: string | null; file: string; line: number; why: string }[];
  anchorsBroken: { rule: string; component: string | null; why: string }[];
};
export type Resolved = {
  generated: string; rule: string; defaultBrand: string;
  brands: Record<string, { label: string; about: string; accent: string; overrides: Record<string, string> }>;
  primitives: { ramps: Record<string, { light: string[]; dark: string[] }>; space: Record<string, number>; radius: Record<string, number>; font: { family: Record<string, string>; size: Record<string, number>; weight: Record<string, number> } };
  semantic: { name: string; group: string; cssVar: string; themed: boolean; layer: string; source: unknown; values: Record<string, Record<"light" | "dark", { value: string; chain: string[] }>> }[];
};
