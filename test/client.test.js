// Unit tests for the client: what it sends and how it reads what comes back,
// against a fetch that answers from a script. Nothing here reaches a network.
//   npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { Everpod, EverpodError, VERSION } from "../src/index.js";

const POD = {
  id: "5f0c1a52-8f1e-4d0b-9a57-3f6f2f7c1e9a",
  name: "Otto",
  kind: "openclaw",
  status: "awaiting_payment",
  created_at: "2026-10-03T09:12:44.512345+00:00",
  url: null,
  pay_url: "https://everpod.ai/create?pod=5f0c1a52-8f1e-4d0b-9a57-3f6f2f7c1e9a",
  plan: null,
  machine: null,
  subscription: null,
};

// A fetch that records the one request it is given and answers `status` with `body`.
function scripted(status, body) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (typeof body === "string") throw new SyntaxError("not JSON");
        return body;
      },
    };
  };
  return { calls, fetchImpl };
}

const client = (fetchImpl, extra = {}) => new Everpod({ apiKey: "everpod_test", fetch: fetchImpl, ...extra });

test("a client without a key says where a key is made", () => {
  assert.throws(
    () => new Everpod({}),
    (e) => e instanceof EverpodError && e.code === "missing_api_key" && e.message.includes("/account/keys")
  );
});

test("listPods asks the list route with the key and returns the pods", async () => {
  const { calls, fetchImpl } = scripted(200, { pods: [POD] });
  const pods = await client(fetchImpl).listPods();
  assert.deepEqual(pods, [POD]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://everpod.ai/api/v1/pods");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.headers.Authorization, "Bearer everpod_test");
  assert.equal(calls[0].init.headers["User-Agent"], `everpod-sdk-node/${VERSION}`);
  assert.equal(calls[0].init.body, undefined);
});

test("getPod asks for the one pod, its id escaped", async () => {
  const { calls, fetchImpl } = scripted(200, { pod: POD });
  assert.deepEqual(await client(fetchImpl).getPod(POD.id), POD);
  assert.equal(calls[0].url, `https://everpod.ai/api/v1/pods/${POD.id}`);
  await client(fetchImpl).getPod("a/b");
  assert.equal(calls[1].url, "https://everpod.ai/api/v1/pods/a%2Fb");
});

test("startPod posts the name as JSON and returns the pod", async () => {
  const { calls, fetchImpl } = scripted(201, { pod: POD });
  assert.deepEqual(await client(fetchImpl).startPod({ name: "Otto" }), POD);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), { name: "Otto" });
});

test("startPod for a developer pod posts its kind and the owner's login", async () => {
  const { calls, fetchImpl } = scripted(201, { pod: POD });
  await client(fetchImpl).startPod({ name: "atlas", kind: "developer", login: "alex" });
  assert.deepEqual(JSON.parse(calls[0].init.body), { name: "atlas", kind: "developer", login: "alex" });
});

test("a base URL with a trailing slash is taken as given without it", async () => {
  const { calls, fetchImpl } = scripted(200, { pods: [] });
  await client(fetchImpl, { baseUrl: "http://localhost:3111/" }).listPods();
  assert.equal(calls[0].url, "http://localhost:3111/api/v1/pods");
});

test("a refusal becomes an EverpodError carrying the API's code, status and sentence", async () => {
  const { fetchImpl } = scripted(404, {
    error: { code: "not_found", message: "No pod with that id on this account." },
  });
  await assert.rejects(
    client(fetchImpl).getPod("nope"),
    (e) =>
      e instanceof EverpodError &&
      e.code === "not_found" &&
      e.status === 404 &&
      e.message === "No pod with that id on this account."
  );
});

test("an answer that is not the API's JSON still says its status", async () => {
  const { fetchImpl } = scripted(502, "<html>bad gateway</html>");
  await assert.rejects(
    client(fetchImpl).listPods(),
    (e) => e instanceof EverpodError && e.code === "http_error" && e.status === 502 && e.message.includes("502")
  );
});

test("a JSON answer of another shape still says its status", async () => {
  const { fetchImpl } = scripted(403, { ok: false, error: "forbidden" });
  await assert.rejects(
    client(fetchImpl).listPods(),
    (e) => e instanceof EverpodError && e.code === "http_error" && e.status === 403
  );
});

test("fetch is called as a plain function, never as a method of the client", async () => {
  let receiver = "unset";
  const strict = async function () {
    receiver = this;
    return { ok: true, status: 200, json: async () => ({ pods: [] }) };
  };
  await client(strict).listPods();
  assert.equal(receiver, undefined);
});

test("a request that never completes is a network_error with its cause", async () => {
  const failing = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(
    client(failing).listPods(),
    (e) => e instanceof EverpodError && e.code === "network_error" && e.cause instanceof TypeError
  );
});
