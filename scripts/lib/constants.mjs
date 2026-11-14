import path from "node:path";

export const ROOT = process.cwd();
export const SRC = path.join(ROOT, "src");
export const PUBLIC = path.join(ROOT, "public");
export const UNLISTED_PATH = path.join(ROOT, "unlisted.txt");
export const ARTICLES_GLOB = "articles/**/index.md";
export const ISSUES_GLOB = "newsletter/issue-*/index.html";
export const SITE_URL = (process.env.SITE_URL || "https://apophenia.news").replace(/\/+$/, "");
// Public site key of the "newsletter" Turnstile widget (secret lives on newsletter.planetrenox.com)
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFG4HWETOcDDQ5vg";

export const AUTHOR_PAGES = [
  {
    slug: "renox",
    name: "Renox",
    bio: "Renox is the founder of apophenia.news.",
    contact: "planetrenox@protonmail.com",
    image: "",
    // Same key as planetrenox.com/publickey.asc
    pgp: {
      fingerprint: "4832 173C BE19 C949 9C2D 1B48 2F0E E02D 78B1 03A4",
      url: "https://planetrenox.com/publickey.asc",
      key: `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZYZAoxYJKwYBBAHaRw8BAQdA9OrpTcNc1Vmpl1imA4zVi50LEX2O8Xbk
jVyThI70mlrNN3BsYW5ldHJlbm94QHByb3Rvbm1haWwuY29tIDxwbGFuZXRy
ZW5veEBwcm90b25tYWlsLmNvbT7CjAQQFgoAPgWCZYZAowQLCQcICZAvDuAt
eLEDpAMVCAoEFgACAQIZAQKbAwIeARYhBEgyFzy+GclJnC0bSC8O4C14sQOk
AADN1wEAzienfkyUKMdECE1/mwyWYXLRjLcH2EUSyG4aRMywutgA+gN7n3N7
TDqDh3dOb1ugtMil57GPq3d4PW49BYkhPqANzjgEZYZAoxIKKwYBBAGXVQEF
AQEHQDqCoIaCIjWagVjUegFSc1haigjwkC9eY1tSX7gQPq45AwEIB8J4BBgW
CgAqBYJlhkCjCZAvDuAteLEDpAKbDBYhBEgyFzy+GclJnC0bSC8O4C14sQOk
AAAxAwEA505uja+6eR110rfqODzVfhfPzi2ZxNkoG8TVBtmJtAUBAJ/0fusP
VyWCojDLCG8wJ1VCZmgJZ/Sn31prSpZ7dA8M
=g4h3
-----END PGP PUBLIC KEY BLOCK-----`
    }
  }
];
