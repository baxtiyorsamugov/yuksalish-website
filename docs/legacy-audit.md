# Legacy site audit

Inspected on 2026-10-20 from `idea (3).zip` and `news (1).sql`, without extracting or publishing either file.

## Inventory

- Archive: 4,837 files, about 1.33 GB uncompressed.
- Public entry points include `index.php` and `page.php`; Apache rewrite rules are in `.htaccess`.
- A separate `a-p/` administration area handles news and regional news.
- Four language files exist: English, Russian, Uzbek Latin, and Uzbek Cyrillic.
- Navigation covers organization/about, activities, projects, partners, news, membership, regions, experts, documents, events, and several specialized programs. Some links are commented out or duplicated, so the final page map needs editorial review.
- Most of the archive is uploaded images and documents. It also contains an 83 MB `error_log`.
- The SQL export defines and populates only the `news` table. PHP source also refers to tables such as `region_news`, `regions`, `experts`, `events`, `member`, and `architecture_news`. Their schemas and data are absent from the supplied export.

## Migration constraints

1. Database credentials are hard-coded in numerous PHP files. Replace them with environment-based configuration and rotate the old database password before any source is published.
2. Do not commit the original archive, SQL export, logs, or unreviewed uploads. Review media for ownership, necessity, and size before adding selected assets.
3. The old `.htaccess` redirects HTTP to HTTPS. A local LAN preview needs a development-only web server configuration while production keeps HTTPS.
4. Preserve old public URLs where useful, or add explicit redirects when the new route structure is agreed.
5. News can be migrated from the available export. Other dynamic content needs another export or an explicit decision to rebuild it.

## Next milestones

1. Agree on required pages, administration features, and visual direction. The new site will retain all four existing languages; a design reference is forthcoming.
2. Set up a reproducible local PHP/Apache and MySQL-compatible development environment.
3. Build the new public site and administration area in small sections.
4. Import available content, verify routes and forms, then test the LAN preview with both collaborators.
