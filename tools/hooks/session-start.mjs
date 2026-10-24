#!/usr/bin/env node
// SessionStart: запомнить, как выглядели исходники в начале сессии.
import { fingerprint, readInput, rootOf, state } from "./lib.mjs";

const input = readInput();
const s = state(input.session_id);
s.write({ ...s.read(), clean: fingerprint(rootOf(input)), blocks: 0, stopped: false });
process.exit(0);
