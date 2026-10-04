export declare const VERSION: string;

/** A pod's status. What each means: https://everpod.ai/docs/api */
export type PodStatus =
  | "awaiting_payment"
  | "building"
  | "setup_delayed"
  | "ready"
  | "needs_attention"
  | "stopped";

export interface PodSubscription {
  status: string;
  /** When the paid period ends. */
  current_period_end: string | null;
  /** Whether the subscription is set to end then. */
  cancel_at_period_end: boolean;
}

export interface Pod {
  id: string;
  /** The name of the pod's agent. */
  name: string;
  /** The agent software the pod runs. */
  harness: string;
  status: PodStatus;
  created_at: string;
  /** The pod's page on everpod.ai. Null until the pod is paid for. */
  url: string | null;
  /** Where the pod's owner pays, in a browser. Present while the status is "awaiting_payment". */
  pay_url: string | null;
  /** The plan the pod is on. Null until the pod is paid for. */
  plan: string | null;
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
  /** Start a pod. Nothing is charged: the pod stays unpaid until its owner pays at `pay_url`. */
  startPod(input: { name: string }): Promise<Pod>;
}
