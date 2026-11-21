// Sorts an alert into one of our five categories from text about it: the name
// of the product or log source that raised it, the rule or alert title, tags.
// Used by every connector whose source aggregates many tools.
//
// Rules are tried in order and the first match wins, so the order is deliberate:
//   email  before everything (a phishing alert from a cloud mail product is email)
//   web    before network    (a WAF is a web control, not a firewall)
//   cloud  before endpoint   (identity and SaaS alerts often mention a device)
//   endpoint before network  (malware alerts often mention a connection)
// Whole words are matched, so "ips" does not fire on "tips".

import type { AlertCategory } from "./types";

const RULES: [AlertCategory, RegExp][] = [
  [
    "email",
    /defender for office|office ?365 atp|exchange online protection|\be-?mails?\b|\bmailbox|\bmail (flow|protection|security|forward)|phish|\bspam\b|proofpoint|mimecast|abnormal security|ironscales|tessian|\bagari\b|cofense|barracuda (email|essentials)|\bbec\b|business email|inbox rule/,
  ],
  [
    "web",
    /web application firewall|\bwaf\b|cloudflare|akamai|imperva|incapsula|f5 (asm|waf|advanced waf)|big-?ip asm|application gateway|bot (protection|manager)|zscaler|web (proxy|gateway|filter(ing)?|attack|shell)|\bwebshell\b|\bproxy\b|proxysg|blue ?coat|\bsquid\b|url filter|sql injection|\bsqli\b|\bxss\b|cross[- ]site|http flood|directory traversal|path traversal/,
  ],
  [
    "cloud",
    /defender for (cloud|resource manager|storage|key vault|dns|sql|cosmos|containers|servers|identity|app service)|cloud apps|\bmcas\b|azure ad\b|azure active directory|\bentra\b|identity protection|\baws\b|amazon web services|guardduty|security hub|cloudtrail|\bgcp\b|google (cloud|workspace|security command)|prisma cloud|lacework|\bwiz\b|orca security|kubernetes|\bk8s\b|\bs3 bucket|\biam\b|\bokta\b|\bduo\b|ping identity|onelogin|active directory|\bsaas\b|salesforce|\bo365\b|office ?365|sharepoint|onedrive|azure (activity|resource|key vault|storage|subscription)|impossible travel|\bmfa\b|multi-?factor|conditional access|service principal|oauth app|consent grant|sign-?ins?\b|cloud security|cloud workload/,
  ],
  [
    "edr",
    /defender for endpoint|\bmde\b|sentinelone|crowdstrike|\bfalcon\b|carbon black|cybereason|sophos (intercept|endpoint)|trend micro (apex|vision)|cortex xdr|xdr agent|symantec endpoint|mcafee (endpoint|ens)|trellix|malwarebytes|\bedr\b|\bendpoints?\b|sysmon|windows (security )?event|\bpowershell\b|ransomware|malware|trojan|process injection|credential dump|\blsass\b|mimikatz|scheduled task|\bregistry\b|antivirus|\bworkstation|\bhost-?based/,
  ],
  [
    "network",
    /firewall|palo alto|pan-?os|\bngfw\b|fortinet|fortigate|cisco (asa|meraki|firepower|ftd|umbrella|ise)|check ?point|sonicwall|watchguard|juniper|\bsnort\b|suricata|\bzeek\b|corelight|darktrace|vectra|extrahop|network watcher|nsg flow|\bids\b|\bips\b|intrusion|netflow|\bdns\b|\bvpn\b|port scan|lateral movement|\bsmb\b|\brdp\b|command and control|\bc2\b|beacon|\bddos\b|denial of service|\bnetwork/,
  ],
];

/** The category the text points to, or null when nothing in it is recognised. */
export function matchCategory(text: string): AlertCategory | null {
  const lower = (text || "").toLowerCase();
  for (const [category, pattern] of RULES) {
    if (pattern.test(lower)) return category;
  }
  return null;
}

/**
 * Try several pieces of evidence in order of how specific they are (for example
 * the product name, then the alert title, then the incident title) and take the
 * first that is recognised. Keeps a vague title from overriding a clear product.
 */
export function categoriseBy(evidence: unknown[], fallback: AlertCategory): AlertCategory {
  for (const text of evidence) {
    const hit = matchCategory(String(text || ""));
    if (hit) return hit;
  }
  return fallback;
}

/** As matchCategory, with a fallback for unrecognised text. */
export function mapProductToCategory(text: string, fallback: AlertCategory = "cloud"): AlertCategory {
  return matchCategory(text) ?? fallback;
}
