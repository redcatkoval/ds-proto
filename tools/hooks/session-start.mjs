#!/usr/bin/env node
// SessionStart: запомнить, как выглядели исходники в начале сессии, и сказать агенту его роль.
import { fingerprint, readInput, rootOf, state } from "./lib.mjs";
import { brief, roleOf } from "./roles.mjs";

const input = readInput();
const root = rootOf(input);
const s = state(input.session_id);
s.write({ ...s.read(), clean: fingerprint(root), blocks: 0, stopped: false });
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: brief(roleOf(root)) } }));
process.exit(0);
