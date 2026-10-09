export declare const VERSION: string;

/** A pod's status. What each means: https://everpod.ai/docs/api */
export type PodStatus =
  | "awaiting_payment"
  | "building"
  | "setup_delayed"
  | "awaiting_connection"
  | "ready"
  | "needs_attention"
  | "stopped";

/** An OpenClaw pod, or a developer pod. */
export type PodKind = "openclaw" | "developer";

/** A coding agent a developer pod can come with: Claude Code, Codex, OpenCode, Pi, Hermes or OpenClaw. */
export type DeveloperAgent = "claude" | "codex" | "opencode" | "pi" | "hermes" | "openclaw";
/** A developer pod's size: the S, the M or the L (the sizes and prices are on everpod.ai/developer-pod). */
export type DeveloperSize = "s" | "m" | "l";

/** A developer pod's machine. */
export interface PodMachine {
  vcpu: number;
  ram_gb: number;
  disk_gb: number;
  /** The owner's username on the machine. */
  login: string;
  /** The coding agents that come installed, as the owner chose when starting the pod; Claude Code and Codex when nobody chose. */
  agents: DeveloperAgent[];
  /** The size bought: "s", "m" or "l" (its vcpu, ram_gb and disk_gb above are that size's). */
  size: DeveloperSize;
  /** The machine's name on its owner's Tailscale network. Null until it has joined. */
  hostname: string | null;
  /** Whether its key expiry is switched off there. */
  key_expiry_off: boolean;
  /** Whether its owner has logged in. */
  logged_in: boolean;
}

export interface PodSubscription {
  status: string;
  /** When the paid period ends. */
  current_period_end: string | null;
  /** Whether the subscription is set to end then. */
  cancel_at_period_end: boolean;
}

export interface Pod {
  id: string;
  /** The name of the pod's agent, or of a developer pod's machine. */
  name: string;
  kind: PodKind;
  status: PodStatus;
  created_at: string;
  /** The pod's page on everpod.ai. Null until the pod is paid for. */
  url: string | null;
  /** Where the pod's owner pays, in a browser. Present while the status is "awaiting_payment". */
  pay_url: string | null;
  /** The plan the pod is on. Null until the pod is paid for. */
  plan: string | null;
  /** Null for an OpenClaw pod. */
  machine: PodMachine | null;
  /** Null until the pod is paid for. */
  subscription: PodSubscription | null;
}

export interface EverpodOptions {
  /** A key the account's owner made at https://everpod.ai/account/keys. */
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export declare class EverpodError extends Error {
  /** The refusal's code, or "network_error", "http_error", "missing_api_key". */
  code?: string;
  /** The HTTP status, when the API answered. */
  status?: number;
}

export declare class Everpod {
  constructor(options: EverpodOptions);
  /** The pods on the account, oldest first. */
  listPods(): Promise<Pod[]>;
  /** One pod by its id. */
  getPod(id: string): Promise<Pod>;
  /** Start a pod. A developer pod takes `kind: "developer"`, `login`, the owner's username on
      the machine, `agents`, which coding agents come installed (Claude Code and Codex when left out), and `size`,
      "s", "m" or "l" (the S when left out). Nothing is
      charged: the pod stays unpaid until its owner pays at `pay_url`. */
  startPod(input: { name: string; kind?: PodKind; login?: string; agents?: DeveloperAgent[]; size?: DeveloperSize }): Promise<Pod>;
}
