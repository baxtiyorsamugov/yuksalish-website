"""Create a disposable, read-only preview copy from the supplied site archive.

The output directory is ignored by Git. Never publish it: the archive contains
historical content and the script only removes the known database credentials.
"""

from __future__ import annotations

import re
import shutil
import sys
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "idea (3).zip"
DESTINATION = ROOT / "legacy-site"
DIRECTORIES = {
    "assets", "blocks", "calendar", "content", "core", "css", "files",
    "fonts", "images", "js", "lang", "vendor",
}
ROOT_FILES = {
    "index.php", "page.php", "stat.php", "cal.php", "search.php",
    "main.css", "jquery.js", "footer.php", "topmenu.php",
}
SKIP_FILES = {"js/handler.php", "calendar/events.php"}

CREDENTIAL_ASSIGNMENT = re.compile(
    rb"(?m)^(?P<indent>[ \t]*)\$(?P<name>host|db|user|pass|charset)"
    rb"[ \t]*=[ \t]*(?:'[^'\r\n]*'|\"[^\"\r\n]*\")[ \t]*;"
)
REPLACEMENTS = {
    b"host": b"$host = getenv('DB_HOST') ?: 'db';",
    b"db": b"$db = getenv('DB_NAME') ?: 'legacy_reference';",
    b"user": b"$user = getenv('DB_USER') ?: '';",
    b"pass": b"$pass = getenv('DB_PASSWORD') ?: '';",
    b"charset": b"$charset = 'utf8mb4';",
}

DEV_HTACCESS = """Options -Indexes
<LimitExcept GET HEAD>
    Require all denied
</LimitExcept>
RewriteEngine On
RewriteRule ^(a-p|blocks|core|lang|content|vendor|calendar)/ - [F,L]
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^([a-zA-Z]+)/?$ index.php?lang=$1 [L,QSA]
RewriteRule ^([a-zA-Z_]+)/([a-zA-Z_0-9]+)/?$ page.php?lang=$1&page=$2 [L,QSA]
RewriteRule ^([a-zA-Z_]+)/([a-zA-Z_0-9]+)/([a-zA-Z_0-9]+)/?$ page.php?lang=$1&page=$2&id=$3 [L,QSA]
"""


def keep(path: PurePosixPath) -> bool:
    if len(path.parts) == 1:
        return path.name in ROOT_FILES
    if path.parts[0] not in DIRECTORIES:
        return False
    if path.as_posix() in SKIP_FILES:
        return False
    if path.suffix.lower() == ".php" and path.parts[0] not in {
        "blocks", "content", "core", "lang", "vendor"
    }:
        return False
    return True


def sanitize_php(raw: bytes) -> tuple[bytes, int]:
    changes = 0

    def replace(match: re.Match[bytes]) -> bytes:
        nonlocal changes
        changes += 1
        return match.group("indent") + REPLACEMENTS[match.group("name")]

    data = CREDENTIAL_ASSIGNMENT.sub(replace, raw)
    data = data.replace(
        b"$translate = $lang[$word];",
        b"$translate = (string) ($lang[$word] ?? $word);",
    )
    return data, changes


def main() -> int:
    if not ARCHIVE.is_file():
        print("Site archive is missing", file=sys.stderr)
        return 1
    DESTINATION.mkdir(exist_ok=True)
    extracted = 0
    replacements = 0
    with zipfile.ZipFile(ARCHIVE) as archive:
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or ".." in path.parts or not keep(path):
                continue
            if (entry.external_attr >> 16) & 0o170000 == 0o120000:
                continue
            target = DESTINATION.joinpath(*path.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            if path.suffix.lower() == ".php" and path.parts[0] != "vendor":
                data, count = sanitize_php(archive.read(entry))
                target.write_bytes(data)
                replacements += count
            else:
                with archive.open(entry) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)
            extracted += 1
    (DESTINATION / ".htaccess").write_text(DEV_HTACCESS, encoding="utf-8")
    print(f"Prepared {extracted} files; replaced {replacements} credential assignments")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
