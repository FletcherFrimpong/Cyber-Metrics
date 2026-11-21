// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AlertStore } from "./alert-store.ts";

function alert(id: string, over: Record<string, any> = {}): any {
  return {
    id, timestamp: "2026-11-02T03:14:15.000Z", severity: "High", category: "x", title: "t", description: "",
    source: "s", platform: "p", rawLog: { classification: "unknown" }, mitreTactics: ["Impact"], mitreTechniques: ["T1486"],
    iocIndicators: [], affectedEntities: [], remediationSteps: [], costImpact: 200000, ...over,
  };
}

test("alerts and poll state survive closing and reopening the database", () => {
  const dir = mkdtempSync(join(tmpdir(), "sf-store-"));
  const path = join(dir, "nested", "test.db");
  try {
    const a = new AlertStore(path);
    a.upsert([alert("SPLUNK-1"), alert("SPLUNK-2", { department: "Finance" })], "edr");
    a.upsert([alert("CS-1")], "cloud");
    a.setState("connector:splunk", "2026-11-21T03:00:00.000Z");
    a.close();

    const b = new AlertStore(path);
    assert.equal(b.count(), 3);
    const all = b.loadAll();
    assert.deepEqual(all.map((r) => r.alert.id).sort(), ["CS-1", "SPLUNK-1", "SPLUNK-2"]);
    assert.equal(all.find((r) => r.alert.id === "CS-1")!.category, "cloud");
    const two = all.find((r) => r.alert.id === "SPLUNK-2")!.alert;
    assert.equal(two.department, "Finance");
    assert.deepEqual(two.mitreTechniques, ["T1486"]);
    assert.equal(b.getState("connector:splunk"), "2026-11-21T03:00:00.000Z");
    b.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the same id is replaced, not duplicated, so a changed verdict is kept", () => {
  const s = new AlertStore(":memory:");
  s.upsert([alert("SENTINEL-1")], "edr");
  s.upsert([alert("SENTINEL-1", { rawLog: { classification: "truePositive" }, severity: "Critical" })], "network");
  assert.equal(s.count(), 1);
  const [row] = s.loadAll();
  assert.equal(row.category, "network");
  assert.equal(row.alert.rawLog.classification, "truePositive");
  assert.equal(row.alert.severity, "Critical");
});

test("deleting by prefix removes one source only and treats _ and % literally", () => {
  const s = new AlertStore(":memory:");
  s.upsert([alert("SPLUNK-1"), alert("SPLUNK-2"), alert("S1-9"), alert("SXLUNK-3"), alert("CS-1")], "edr");
  assert.equal(s.deleteByPrefix("SPLUNK-"), 2);
  assert.equal(s.deleteByPrefix("S_-"), 0); // "_" is not a wildcard
  assert.equal(s.deleteByPrefix("%"), 0);
  assert.deepEqual(s.loadAll().map((r) => r.alert.id).sort(), ["CS-1", "S1-9", "SXLUNK-3"]);
});

test("poll state can be set, replaced and cleared", () => {
  const s = new AlertStore(":memory:");
  assert.equal(s.getState("sentinel"), null);
  s.setState("sentinel", "a");
  s.setState("sentinel", "b");
  assert.equal(s.getState("sentinel"), "b");
  s.setState("sentinel", null);
  assert.equal(s.getState("sentinel"), null);
});

test("a large batch is written in one transaction", () => {
  const s = new AlertStore(":memory:");
  s.upsert(Array.from({ length: 5000 }, (_, i) => alert(`CS-${i}`)), "edr");
  assert.equal(s.count(), 5000);
});
