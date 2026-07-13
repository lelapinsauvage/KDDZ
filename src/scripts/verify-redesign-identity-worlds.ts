import fs from "node:fs"
import path from "node:path"
import {
  identityDecisionCriteria,
  identityWorldDefinitions,
} from "../app/design-lab/brand-directions/_identity-world-data"
import { finalistIds } from "../app/design-lab/brand-directions/_finalist-data"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const root = process.cwd()
const componentPath = path.join(
  root,
  "src/app/design-lab/brand-directions/identity-worlds/_components/identity-world-room.tsx",
)
const pagePath = path.join(root, "src/app/design-lab/brand-directions/identity-worlds/page.tsx")
const stylePath = path.join(root, "src/app/design-lab/brand-directions/identity-worlds/identity-worlds.css")
const dossierPath = path.join(root, "docs/redesign/finalist-identity-worlds.md")
const videoPath = path.join(root, "public/brand/kiddz-online-logo-intro.mp4")
const posterPath = path.join(root, "public/brand/kiddz-online-logo-intro-poster.png")
const captionsPath = path.join(root, "public/brand/kiddz-online-logo-intro.en.vtt")

for (const filePath of [componentPath, pagePath, stylePath, dossierPath, videoPath, posterPath, captionsPath]) {
  assert(fs.existsSync(filePath), `Missing identity-world artifact: ${path.relative(root, filePath)}`)
}

const component = fs.readFileSync(componentPath, "utf8")
const page = fs.readFileSync(pagePath, "utf8")
const styles = fs.readFileSync(stylePath, "utf8")
const dossier = fs.readFileSync(dossierPath, "utf8")
const captions = fs.readFileSync(captionsPath, "utf8")

assert(finalistIds.length === 2, "Identity proof must contain exactly two finalists")
assert(new Set(finalistIds).size === finalistIds.length, "Finalist IDs must be unique")
assert(identityDecisionCriteria.length === 5, "Identity proof must use five fixed decision criteria")

for (const id of finalistIds) {
  const world = identityWorldDefinitions[id]
  assert(world.name.length > 0, `${id} needs a name`)
  assert(world.thesis.length > 40, `${id} needs a strategic thesis`)
  assert(world.memoryAsset.length > 12, `${id} needs a distinctive memory asset`)
  assert(world.memoryRule.length > 30, `${id} needs a governed memory rule`)
  assert(world.palette.length === 6, `${id} must define exactly six color roles`)
  assert(new Set(world.palette.map((color) => color.value)).size === 6, `${id} palette values must be unique`)
  assert(world.palette.every((color) => /^#[0-9A-F]{6}$/i.test(color.value)), `${id} palette must use valid hex values`)
  assert(world.palette.every((color) => color.job.length > 12), `${id} palette colors need semantic jobs`)
  assert(world.voice.length === 4, `${id} must prove four consequence-aware voice moments`)
  assert(world.voice.every((example) => example.source.length > 20 && example.rule.length > 24), `${id} voice examples need source truth and rules`)
  assert(world.imageSystem.construction.length === 4, `${id} needs four image construction rules`)
  assert(world.imageSystem.reject.length === 3, `${id} needs three image rejection rules`)
  assert(world.motion.sequence.length === 4, `${id} motion signature needs four stages`)
  assert(world.motion.reduced.length > 35, `${id} needs a reduced-motion equivalent`)
  assert(world.applications.length === 3, `${id} must prove staff, family, and brand applications`)
  assert(world.strongestWhen.length > 50, `${id} needs an explicit selection case`)
  assert(world.failsWhen.length > 50, `${id} needs an explicit kill condition`)
  assert(dossier.includes(world.name), `Identity dossier must document ${world.name}`)
  assert(dossier.includes(world.memoryAsset), `Identity dossier must document ${id} memory asset`)
}

assert(component.includes("kiddz-online-logo-intro.mp4"), "Identity proof must preserve the approved logo render")
assert(component.includes("finalistIds.map"), "Identity room must render every finalist from the shared source")
assert(component.includes("identityWorldDefinitions[activeId]"), "Identity room must resolve the active world from shared data")
assert(component.includes("kiddz-online-logo-intro.en.vtt"), "Approved logo render must expose captions")
assert(component.includes('kind="captions"'), "Logo track must be a caption track")
assert(component.includes('reducedMotion="user"'), "Identity motion must respect user reduced-motion preference")
assert(component.includes("AxeAuditHarness"), "Identity proof must include executable accessibility evidence")
assert(component.includes("window.history.replaceState"), "Finalist selection must persist in the direct URL")
assert(component.includes("role=\"group\""), "Motion and mark demonstrations need named accessible groups")
assert(page.includes("finalistIds.includes"), "Identity route must validate direct finalist query values")
assert(styles.includes("@media (max-width: 700px)"), "Identity proof must define a mobile composition")
assert(styles.includes("@media (forced-colors: active)"), "Identity proof must support forced colors")
assert(styles.includes("@media (prefers-reduced-motion: reduce)"), "Identity proof must support reduced motion")
assert(!styles.includes("linear-gradient("), "Identity proof must not use decorative gradients")
assert(!styles.includes("radial-gradient("), "Identity proof must not use decorative gradients")
assert(captions.startsWith("WEBVTT"), "Logo captions must be valid WebVTT")

for (const requiredBoundary of [
  "production brand selection open",
  "This verdict is not the production selection",
  "No hybrid is authorized",
  "trademark",
  "selected Arabic family",
  "production performance",
]) {
  assert(dossier.toLowerCase().includes(requiredBoundary.toLowerCase()), `Identity dossier is missing boundary: ${requiredBoundary}`)
}

for (const source of [
  "Ehrenberg-Bass",
  "Duolingo Brand Guidelines",
  "Headspace Rebrand",
  "Apple Human Interface Guidelines: Motion",
  "Vercel Geist",
]) {
  assert(dossier.includes(source), `Identity dossier is missing source: ${source}`)
}

console.log(
  `Identity-world verification passed (${finalistIds.length} finalists, ${identityDecisionCriteria.length} fixed criteria, no production selection)`,
)
