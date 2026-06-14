// ============================================================
// GET /api/models — Live2D Model Registry (auto-scan)
// ============================================================
// Scans public/resources/live2d/models/ at request time.
// Returns every discovered model with health metadata.
// ============================================================

import { NextResponse } from "next/server";
import { readdirSync, existsSync, readFileSync, statSync } from "fs";
import { join, relative, basename, dirname } from "path";

// ── Types ─────────────────────────────────────────────────

export interface ModelManifestEntry {
  id: string;
  name: string;
  jsonPath: string;
  path: string;
  jsonPaths: string[];
  groupSize: number;
  version: "cubism2" | "cubism3+";
  status: "valid" | "warning" | "broken";
  hasMotions: boolean;
  hasExpressions: boolean;
  hasPhysics: boolean;
  textureCount: number;
  previewColor: string;
  statusReason?: string;
}

// ── Config ────────────────────────────────────────────────

const MODELS_ROOT = join(process.cwd(), "public/resources/live2d/models");
const EXCLUDED_DIRS = new Set(["lib", "node_modules"]);

// ── Helpers ───────────────────────────────────────────────

/** Find all directories containing model.json or model3.json */
function findModelDirs(root: string): string[] {
  const results: string[] = [];
  if (!existsSync(root)) return results;

  try {
    const entries = readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || EXCLUDED_DIRS.has(entry.name)) continue;
      const full = join(root, entry.name);
      // Check if this dir directly contains a model JSON
      const hasModelJson = existsSync(join(full, "model.json")) ||
        existsSync(join(full, "model3.json"));
      // Also check for non-standard filenames like "31.model3.json"
      let hasNamedModelJson = false;
      try {
        hasNamedModelJson = readdirSync(full).some(
          (f) => f.endsWith(".model.json") || f.endsWith(".model3.json"),
        );
      } catch { /* skip */ }

      if (hasModelJson || hasNamedModelJson) {
        results.push(full);
      } else {
        // Recurse into subdirectories (e.g. vts/31/)
        results.push(...findModelDirs(full));
      }
    }
  } catch { /* skip permission errors */ }
  return results;
}

/** Find the model JSON file in a directory */
function findModelJson(dir: string): { file: string; isModel3: boolean } | null {
  // Standard names first
  for (const name of ["model3.json", "model.json"]) {
    const p = join(dir, name);
    if (existsSync(p)) return { file: p, isModel3: name === "model3.json" };
  }
  // Any *.model3.json or *.model.json
  try {
    const entries = readdirSync(dir);
    const m3 = entries.find((f) => f.endsWith(".model3.json"));
    if (m3) return { file: join(dir, m3), isModel3: true };
    const m2 = entries.find((f) => f.endsWith(".model.json"));
    if (m2) return { file: join(dir, m2), isModel3: false };
  } catch { /* skip */ }
  return null;
}

/** Recursively count files matching extensions */
function countFilesRecursive(dir: string, exts: string[]): number {
  let count = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { count += countFilesRecursive(full, exts); }
      else if (exts.some((x) => e.name.endsWith(x))) { count++; }
    }
  } catch { /* skip */ }
  return count;
}

function countFiles(dir: string, patterns: string[]): number {
  try {
    return readdirSync(dir).filter((f) =>
      patterns.some((p) => {
        if (p.endsWith("/")) return statSync(join(dir, f)).isDirectory() && f === p.slice(0, -1);
        return f.endsWith(p);
      }),
    ).length;
  } catch {
    return 0;
  }
}

function dirExists(dir: string, name: string): boolean {
  return existsSync(join(dir, name));
}

/** Check for .moc or .moc3 anywhere inside dir */
function hasMocFile(dir: string): boolean {
  if (existsSync(join(dir, `${basename(dir)}.moc3`))) return true;
  if (existsSync(join(dir, `${basename(dir)}.moc`))) return true;
  // Check inside moc/ subdirectory (Cubism 2 convention)
  if (dirExists(dir, "moc")) {
    try {
      const mocDir = join(dir, "moc");
      return readdirSync(mocDir).some(
        (f) => f.endsWith(".moc") || f.endsWith(".moc3"),
      );
    } catch { /* skip */ }
  }
  // Also check the root dir for any .moc/.moc3 file
  try {
    return readdirSync(dir).some((f) => f.endsWith(".moc") || f.endsWith(".moc3"));
  } catch { return false; }
}

// ── Colour palette for preview badges ─────────────────────

const PALETTE = [
  "#d4956a", "#6b8d9e", "#c97a8b", "#6b8c5c",
  "#a78bfa", "#f59e0b", "#06b6d4", "#ec4899",
  "#84cc16", "#f97316", "#8b5cf6", "#14b8a6",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ── Main scan ─────────────────────────────────────────────

function scanModels(): ModelManifestEntry[] {
  const dirs = findModelDirs(MODELS_ROOT);
  return dirs.map((dir) => {
    const rel = relative(MODELS_ROOT, dir).replace(/\\/g, "/");
    const modelJson = findModelJson(dir);

    if (!modelJson) {
      return {
        id: rel.replace(/\//g, "-"),
        name: basename(dir),
        jsonPath: "",
        path: "",
        jsonPaths: [],
        groupSize: 0,
        version: "cubism2",
        status: "broken" as const,
        hasMotions: false,
        hasExpressions: false,
        hasPhysics: false,
        textureCount: 0,
        previewColor: colorForId(rel),
        statusReason: "未找到 model.json 或 model3.json",
      };
    }

    const isModel3 = modelJson.isModel3;
    let modelData: any = {};
    try {
      modelData = JSON.parse(readFileSync(modelJson.file, "utf-8"));
    } catch { /* invalid JSON */ }

    // ── Version detection ──────────────────────────────────
    const version: "cubism2" | "cubism3+" =
      isModel3 || modelData?.Version === 3 || modelData?.FileReferences
        ? "cubism3+"
        : "cubism2";

    // ── File completeness ─────────────────────────────────
    const hasMoc = hasMocFile(dir) ||
      (modelData?.FileReferences?.Moc
        ? existsSync(join(dir, modelData.FileReferences.Moc))
        : false);

    const motionsDir =
      dirExists(dir, "motions") || dirExists(dir, "mtn") || dirExists(dir, "animations");
    const hasMotions = motionsDir
      ? countFiles(
          join(dir, ["motions", "mtn", "animations"].find((d) => dirExists(dir, d))!),
          [".motion3.json", ".motion.json", ".mtn"],
        ) > 0
      : false;

    const expressionsDir = dirExists(dir, "expressions") || dirExists(dir, "exp");
    const hasExpressions = expressionsDir
      ? countFiles(
          join(dir, ["expressions", "exp"].find((d) => dirExists(dir, d))!),
          [".exp3.json", ".exp.json"],
        ) > 0
      : modelData?.FileReferences?.Expressions?.length > 0;

    const hasPhysics =
      existsSync(join(dir, `${basename(dir)}.physics3.json`)) ||
      existsSync(join(dir, `${basename(dir)}.physics.json`)) ||
      (modelData?.FileReferences?.Physics
        ? existsSync(join(dir, modelData.FileReferences.Physics))
        : false) ||
      existsSync(join(dir, "physics.json")) ||
      existsSync(join(dir, "physics3.json"));

    const textures = modelData?.FileReferences?.Textures;
    const textureCount = Array.isArray(textures)
      ? textures.length
      : countFilesRecursive(dir, [".png", ".jpg", ".dds"]);

    // ── Status ────────────────────────────────────────────
    let status: "valid" | "warning" | "broken" = "valid";
    const warnings: string[] = [];
    if (!hasMoc) { status = "broken"; warnings.push("缺失 .moc / .moc3"); }
    if (textureCount === 0) { status = "broken"; warnings.push("无纹理文件"); }
    if (!hasMotions) warnings.push("无动作文件");
    if (!hasExpressions) warnings.push("无表情文件");
    if (!hasPhysics && version === "cubism3+") warnings.push("无物理文件");
    if (status === "valid" && warnings.length > 0) status = "warning";

    // ── Name ──────────────────────────────────────────────
    const HUMAN_NAMES: Record<string, string> = {
      chitose: "千岁 (chitose)",
      epsilon2_1: "Epsilon2.1",
      "haru-01": "小春·姐姐 (haru-01)",
      "haru-02": "小春·妹妹 (haru-02)",
      haruto: "Haruto (暖阳少年)",
      hijiki: "Hijiki (黑发少女)",
      izumi: "Izumi (泉)",
      koharu: "小春 (koharu)",
      nico: "Nico",
      nietzsche: "Nietzsche",
      nipsilon: "Nipsilon",
      nito: "Nito",
      shizuku: "静久 (shizuku)",
      tororo: "Tororo (慵懒系)",
      unitychan: "Unity-chan",
      wanko: "Wanko (柴犬风)",
      z16: "Z16 (未来系)",
    };
    const dirBase = basename(dir);
    let name = HUMAN_NAMES[dirBase] || dirBase;
    if (!HUMAN_NAMES[dirBase]) {
      if (modelData?.name) name = modelData.name;
      else if (modelData?.Name) name = modelData.Name;
    }

    // URL path for loading
    const jsonFileName = basename(modelJson.file);
    const urlPath = "/resources/live2d/models/" + rel + "/" + jsonFileName;

    return {
      id: rel.replace(/\//g, "-"),
      name,
      jsonPath: urlPath,
      path: urlPath,
      jsonPaths: [urlPath],
      groupSize: 1,
      version,
      status,
      hasMotions,
      hasExpressions,
      hasPhysics,
      textureCount,
      previewColor: colorForId(rel),
      statusReason: warnings.length > 0 ? warnings.join("; ") : undefined,
    };
  });
}

// ── Grouping ──────────────────────────────────────────────

interface GroupDef {
  name: string;
  dirs: string[];
}

const GROUPS: GroupDef[] = [
  { name: "小春 (haru) 姐妹", dirs: ["haru-01", "haru-02"] },
  { name: "小春 & Haruto (兄妹)", dirs: ["koharu", "haruto"] },
  { name: "Nico 家族", dirs: ["nico", "nietzsche", "nipsilon", "nito"] },
  { name: "动物伙伴", dirs: ["tororo", "hijiki", "wanko"] },
];

function applyGroups(models: ModelManifestEntry[]): ModelManifestEntry[] {
  const groupedIds = new Set<string>();
  for (const g of GROUPS) {
    for (const d of g.dirs) groupedIds.add(d);
  }

  const result: ModelManifestEntry[] = [];
  const soloModels = models.filter((m) => !groupedIds.has(m.id));

  for (const g of GROUPS) {
    // Preserve group dir order for primary model + path ordering
    const membersOrdered = g.dirs
      .map((d) => models.find((m) => m.id === d))
      .filter(Boolean) as ModelManifestEntry[];
    if (membersOrdered.length === 0) continue;

    // Use the best status among members
    const statuses = membersOrdered.map((m) => m.status);
    const bestStatus: ModelManifestEntry["status"] =
      statuses.every((s) => s === "valid") ? "valid" :
      statuses.some((s) => s === "broken") ? "broken" : "warning";

    const allPaths = membersOrdered.map((m) => m.jsonPath);
    const primary = membersOrdered[0];
    result.push({
      ...primary,
      id: g.dirs.join("-"),
      name: g.name,
      jsonPath: allPaths[0],
      path: allPaths[0],
      jsonPaths: allPaths,
      groupSize: allPaths.length,
      status: bestStatus,
      hasMotions: membersOrdered.some((m) => m.hasMotions),
      hasExpressions: membersOrdered.some((m) => m.hasExpressions),
      hasPhysics: membersOrdered.some((m) => m.hasPhysics),
      textureCount: membersOrdered.reduce((s, m) => s + m.textureCount, 0),
      previewColor: primary.previewColor,
    });
  }

  result.push(...soloModels);
  return result;
}

// ── Route handler ─────────────────────────────────────────

export async function GET() {
  try {
    const models = applyGroups(scanModels());
    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json({ models: [], error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
