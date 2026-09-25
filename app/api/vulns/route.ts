import { readFileSync } from "fs";
import path from "path";
import { json, rejected } from "@/lib/api";
import { latestAdvisories } from "@/lib/sources/github";
import { snykTest } from "@/lib/sources/snyk";
import { packageSchema } from "@/lib/security";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const params = new URL(request.url).searchParams;
  const advisories = await latestAdvisories().catch(() => []);
  if (params.get("self") === "1") {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const name = Object.keys(pkg.dependencies ?? {}).find((item) => !item.startsWith("@"));
    const version = (pkg.dependencies?.[name ?? ""] ?? "").replace(/^[^\d]*/, "") || "0.0.0";
    const self = name ? await snykTest(name, version) : { ok: false, message: "No dependency to test.", issues: [] };
    return json(request, { advisories, self, checked: name ? `${name}@${version}` : "" });
  }
  const name = params.get("name");
  if (!name) return json(request, { advisories, issues: [], message: "" });
  const parsed = packageSchema.safeParse({ name, version: params.get("version") || "latest" });
  if (!parsed.success) return json(request, { error: "Package name or version looks wrong." }, 400);
  const version = parsed.data.version === "latest" ? "latest" : parsed.data.version;
  if (!/^[0-9A-Za-z.+-]+$/.test(version)) return json(request, { error: "Version looks wrong." }, 400);
  const result = await snykTest(parsed.data.name, version);
  return json(request, { advisories, ...result });
}
