/* The Everpod API's JavaScript client: the operations a key can call
   (https://everpod.ai/docs/api) and nothing else. No dependencies: it uses
   the platform's fetch. */

export const VERSION = "0.1.0";

const DEFAULT_BASE_URL = "https://everpod.ai";

/* What the API refused, or what stopped the request reaching it. `message`
   is the API's own sentence, written to be passed on to the account's owner;
   `code` and `status` are the refusal's (https://everpod.ai/docs/api). */
export class EverpodError extends Error {
  constructor(message, { code, status, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "EverpodError";
    this.code = code;
    this.status = status;
  }
}

export class Everpod {
  #apiKey;
  #baseUrl;
  #fetch;

  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, fetch: fetchImpl = globalThis.fetch } = {}) {
    if (!apiKey) {
      throw new EverpodError(
        "An Everpod API key is needed: new Everpod({ apiKey }). The account's owner makes one at https://everpod.ai/account/keys.",
        { code: "missing_api_key" }
      );
    }
    this.#apiKey = apiKey;
    this.#baseUrl = String(baseUrl).replace(/\/+$/, "");
    // Called as a plain function: a platform's fetch refuses to run as a
    // method of another object.
    this.#fetch = (url, init) => fetchImpl(url, init);
  }

  /** The pods on the account, oldest first. */
  async listPods() {
    return (await this.#request("GET", "/pods")).pods;
  }

  /** One pod by its id. */
  async getPod(id) {
    return (await this.#request("GET", `/pods/${encodeURIComponent(id)}`)).pod;
  }

  /** Start a pod under the name its owner wants for their agent. Nothing is
      charged: the pod stays unpaid until its owner pays at `pay_url`. */
  async startPod({ name } = {}) {
    return (await this.#request("POST", "/pods", { name })).pod;
  }

  async #request(method, path, body) {
    let response;
    try {
      response = await this.#fetch(`${this.#baseUrl}/api/v1${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          Accept: "application/json",
          "User-Agent": `everpod-sdk-node/${VERSION}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      throw new EverpodError(`The request to Everpod did not complete: ${cause.message}`, {
        code: "network_error",
        cause,
      });
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new EverpodError(payload?.error?.message || `Everpod answered ${response.status}.`, {
        code: payload?.error?.code || "http_error",
        status: response.status,
      });
    }
    return payload;
  }
}
