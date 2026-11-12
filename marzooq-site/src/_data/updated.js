// Date of the last real change to the site (last git commit), for the footer line.
// The daily rebuild doesn't commit, so this only moves when something actually changes.
import { execSync } from "node:child_process";

const EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const CY = ["Ionawr", "Chwefror", "Mawrth", "Ebrill", "Mai", "Mehefin", "Gorffennaf", "Awst", "Medi", "Hydref", "Tachwedd", "Rhagfyr"];

export default function () {
  let d;
  try { d = new Date(execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim()); } catch (e) {}
  if (!d || isNaN(d)) d = new Date();
  const day = d.getUTCDate(), m = d.getUTCMonth(), y = d.getUTCFullYear();
  return { iso: d.toISOString().slice(0, 10), en: `${day} ${EN[m]} ${y}`, cy: `${day} ${CY[m]} ${y}` };
}
