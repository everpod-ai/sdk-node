# Everpod SDK for JavaScript

The official JavaScript client for the [Everpod API](https://everpod.ai/docs/api).

Everpod is an easy way to get your own always-on, persistent cloud computer for AI agents, working in minutes: with a managed OpenClaw agent on it, or as a developer pod with Claude Code and Codex installed. A key lets an agent or an app you trust see your pods and start a new one for you, which you then pay for on everpod.ai. It can't pay, change or cancel a plan, delete anything, or open your agent's control panel.

If you are connecting an agent such as Claude Code or Codex, you do not need this library: point it at Everpod's MCP server, as the [API reference](https://everpod.ai/docs/api) shows.

## Install

```
npm install @everpod-ai/sdk
```

Node.js 18 or later. No dependencies.

## Use

To make a key, open [everpod.ai/account/keys](https://everpod.ai/account/keys) and sign in with your email address and the code we send you. If you have no account yet, signing in makes one. Give the key to the library from an environment variable.

```js
import { Everpod } from "@everpod-ai/sdk";

const everpod = new Everpod({ apiKey: process.env.EVERPOD_API_KEY });

// Start an OpenClaw pod under the name you want for its agent. Nothing is
// charged: the pod stays unpaid until you open pay_url in a browser and pay there.
const pod = await everpod.startPod({ name: "Otto" });
console.log(pod.status, pod.pay_url);

// Or a developer pod: the machine's name, and your username on it.
const machine = await everpod.startPod({ name: "atlas", kind: "developer", login: "alex" });

// The pods on your account, oldest first.
const pods = await everpod.listPods();

// One pod by its id: how to check whether it has been paid for, and whether it is ready.
const same = await everpod.getPod(pod.id);
```

While your account has an unpaid pod, starting another returns that same pod, changed to the name and kind now asked for.

A pod's fields and what each status means are in the [API reference](https://everpod.ai/docs/api).

## When a request is refused

A refusal throws an `EverpodError`. Its `message` is the API's own sentence, which says what happened and what to do next; `code` and `status` are the refusal's.

```js
import { EverpodError } from "@everpod-ai/sdk";

try {
  await everpod.getPod(id);
} catch (error) {
  if (error instanceof EverpodError) console.log(error.code, error.status, error.message);
}
```

## Questions

[support@everpod.ai](mailto:support@everpod.ai)

## License

MIT
