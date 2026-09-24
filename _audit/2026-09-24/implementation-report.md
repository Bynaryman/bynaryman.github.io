# Implementation report — 24 September 2026

Implemented the audit's content, presentation, functional, and performance corrections. Blog wording remains unchanged; the six existing local drafts are explicitly excluded from publication. Changes are local and have not been pushed or deployed.

## Content and consistency

- Replaced the outdated homepage biography with the Rennes appointment and a concise research summary. Updated the work link, site description, social preview, and mobile content order.
- Reconciled the bibliography to 20 records. Added the ACM school and PEPR IA posters; corrected Bastien Barbe, Maxime Popoff, RFIM accents and author list, final RCM metadata, credit order, deposit versions, and talk/poster classification. Publication dates no longer leak between entries. Name particles are retained.
- Made the web CV resolve publication metadata from BibTeX keys. Fixed contact destinations, restored education summaries, used year-level PhD dates where the exact date was inconsistent, and added the completed ARITH tutorial/demo. Regenerated the four-page PDF from the original LaTeX source and inspected all four pages.
- Integrated the research/software/talks pages, replaced unsupported headline metrics with linked evidence, clarified tapeout/design status, and labelled the unavailable compiler source accurately.
- Added the ARITH tutorial to courses and restored the missing E4M3 course diagram from the original course repository.
- Replaced the stale image dashboard with a curated repository list; the historical GitHub snapshot is explicitly dated.
- Condensed SUF documentation and repaired its publication reference. Kept detailed technical material in the other projects and fixed literal BibTeX parsing.

The RFIM author order was checked against the [published article](https://revues.mshparisnord.fr/rfim/pdf/961.pdf), and Holigrail against the [deposited slides](https://hal.science/hal-05412130/document). Other primary references are recorded in the original audit.

## Rendering and interaction

- Fixed visible Markdown stars in captions through the rendering hook. No visible `**` remains outside code/comments in the generated HTML.
- Normalized archive metadata and generated filters from actual tags/categories. Search indexes each post once and displays “Music/DJ set” as a string.
- Fixed dark-mode persistence and added working system mode, including blocked-storage handling.
- Collapsed navigation at tablet widths, moved homepage social links out of the crowded navbar, corrected shared spacing, and made the footer flow with the page.
- Improved project cards, image descriptions, headings, focus styles, skip navigation, icon labels, and keyboard-operable publication buttons. The CV sidebar is hidden on narrow screens so the profile appears first.
- Removed empty utility routes and the automatic 404 redirect.

## Performance

These are single local measurements and resource sizes, not Lighthouse scores or Core Web Vitals. Direct stylesheet/script bytes exclude module imports, fonts, media, compression, caching, and third-party subrequests.

| Measurement | Audit | After changes |
| --- | ---: | ---: |
| Homepage direct CSS/JS decoded bytes | 2,852,904 | about 303,000 |
| Homepage external script tags | 20 | 10 |
| Homepage stylesheet tags | 7 | 5 |
| Favicon | 3,724,646 bytes | 10,968 bytes |
| Portrait source / 320px variant | 434,200 bytes | 11,634 bytes |
| RetrOrchestre GIF / 640px static preview | 9,602,806 bytes | 22,546 bytes |
| Local production build | 238.972 seconds | about 22 seconds |
| Generated output | 301.9 MB | about 265.9 MB |

Responsive variants cover 46 images. Original images remain available through deliberate zoom/download. Videos use posters and user-triggered playback. Removed unused global math, badge, analytics, layout, font, and MDB resources; fixed CSS cache hashing; avoided expensive JavaScript recompression; excluded unused examples and large unused assets from publication.

## Validation and maintenance

- Production build, CSS purge, and all three theme regression tests pass.
- Generated-site validation passes across 78 HTML files, including course links and assets, internal anchors, IDs, and draft exclusions.
- Browser checks cover desktop, 768px tablet, and 390px phone layouts. Verified navigation, theme persistence, search, publication disclosures, image loading, and caption/video rendering.
- PDF compiles to four pages, with every page visually inspected.
- Deployment now includes bibliography/plugin changes and runs the local checks. PurgeCSS is locked. Axe covers representative pages on pull requests; Lighthouse targets this site and stores reports as artifacts.
- See `DEVELOPMENT.md` for the maintenance workflow. Machine-readable resource measurements are in `fix-verification.json`.

## Deliberately retained limits

Blog prose and drafts need the separate scientific editing pass requested by the owner. The precise PhD end/defence date remains unasserted beyond 2024. Tapeout records distinguish design artifacts from measured silicon claims. Existing Sass dependency deprecation warnings remain; a dependency migration was not mixed into the content refresh. The new hosted Axe/Lighthouse workflows have not run locally, so no automated accessibility score or mobile performance score is claimed. External links can change independently of the validated local build.

The PDF source change is in the sibling `my_CV/my_cv.tex`; its patch is retained here for traceability. No pre-existing untracked blog file was edited.
