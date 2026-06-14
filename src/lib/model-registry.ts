// ============================================================
// Digital Garden — Live2D Model Registry (Client)
// ============================================================
// Fetches the auto-scanned model manifest from /api/models.
// The registry is the SINGLE SOURCE for all model listing in
// the UI — no hardcoded model lists anywhere.
// ============================================================

// Re-export the type from the API route (mirrored to avoid
// importing server code into client bundles)
export interface ModelManifestEntry {
  id: string;
  name: string;
  /** Primary model JSON path (first in group) */
  jsonPath: string;
  /** Alias for jsonPath */
  path: string;
  /** All paths in this group (for 换装 cycling) */
  jsonPaths: string[];
  /** Number of sub-models in this group */
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

interface RegistryResponse {
  models: ModelManifestEntry[];
  error?: string;
}

// ── Cache ──────────────────────────────────────────────────

let cachedModels: ModelManifestEntry[] | null = null;
let fetchPromise: Promise<ModelManifestEntry[]> | null = null;

// ── Public API ────────────────────────────────────────────

/**
 * Fetch the full model manifest from the auto-scan API.
 * Results are cached in memory for the lifetime of the SPA.
 */
export async function fetchModelManifest(): Promise<ModelManifestEntry[]> {
  if (cachedModels) return cachedModels;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/models")
    .then((r) => r.json())
    .then((data: RegistryResponse) => {
      cachedModels = data.models ?? [];
      fetchPromise = null;
      return cachedModels;
    })
    .catch((err) => {
      console.warn("[model-registry] API unreachable — returning empty manifest", err);
      fetchPromise = null;
      return [];
    });

  return fetchPromise;
}

/**
 * Invalidate the cache so the next call re-fetches.
 */
export function invalidateRegistryCache(): void {
  cachedModels = null;
  fetchPromise = null;
}
