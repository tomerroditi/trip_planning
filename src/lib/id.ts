// Short, readable, collision-resistant ids. The MCP tools generate and return
// ids; Claude references them in follow-up updates (spec §7: "IDs returned, not
// invented"). The prefix makes ids self-describing in logs and tool output.

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function newId(prefix: string): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${prefix}_${out}`;
}
