# Site audit — 24 September 2026

The site already contains substantial recent work, but visitors receive an inconsistent picture of your current position and research. The strongest first pass is to synchronize the homepage, bibliography and CV, fix the navigation and theme defects, and reduce the largest shared assets. Keep the existing visual identity; make the reading experience and content structure more consistent before expanding the blog.

This is a report-only audit. No site content, styling, dependencies, or deployment settings were changed.

## Scope and confidence

- Reviewed the authored pages, all 14 local posts and 10 project files, shared layouts, Sass, JavaScript, bibliography, CV data, deployment/check workflows, and the four-page PDF CV.
- Crawled 60 live HTML endpoints: the sitemap's URLs plus the custom 404 document. 59 returned HTTP 200; the leftover `/_pages/dropdown/` route returned 404. Separately checked 111 same-origin link/asset destinations and every authored page permalink.
- Inspected the live homepage, publications, projects, blog, repositories, CV and courses in the browser; sampled desktop, a 768px tablet viewport and a 390px phone viewport. Tested navigation, search, theme switching and theme persistence.
- Cross-checked HAL records, publisher/coauthor records, Crossref metadata and the ACM school programme. HAL's search returned 24 records; four unrelated namesake records were excluded. The remaining 20 match your research.
- Ran production and development builds into temporary directories, then checked links across 108 generated HTML files, including course material.
- Performance numbers below are measured file sizes and build times. They are **not Lighthouse scores, Core Web Vitals, or a measured initial page-transfer total**. No controlled mobile network/CPU benchmark or full screen-reader audit was run. Third-party content and every interactive slide exercise were not exhaustively tested.

Evidence is retained in [audit-evidence.json](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_audit/2026-09-24/audit-evidence.json). Existing untracked work was preserved.

## Priorities

P1 means correct in the first pass; P2 means the following consistency/performance pass; P3 means editorial or maintenance improvement. Effort is approximate, with related fixes overlapping.

| Priority | Finding | Recommended change | Effort |
| --- | --- | --- | --- |
| P1 | Homepage says Emeraude postdoc; web/PDF CV say Associate Professor in Rennes | Synchronize role, affiliation, research summary and work-profile link | Small |
| P1 | Two HAL posters missing; author names, dates and categories disagree | Reconcile bibliography and CV; correct rendering defects | Medium |
| P1 | CV email and phone links contain obfuscated text | Separate display labels from valid contact destinations | Small |
| P1 | Tablet navbar clips controls; dark mode resets after navigation | Correct navbar breakpoint and theme preference initialization | Small–medium |
| P1 | Four blog filters return 404; tags generate colliding archives | Normalize metadata and generate filters from actual tags/categories | Small |
| P1 | A 3.72 MB JPEG is the site-wide favicon | Create appropriately sized favicon assets | Small |
| P1 | Main stylesheet always uses the hash of empty content | Hash the real Sass inputs or final CSS | Small |
| P2 | Shared pages load scripts they do not need | Load math, badges, layout and media helpers by page requirements | Medium |
| P2 | Large GIF/images/videos dominate media-heavy pages | Generate responsive images, replace GIF previews, use deliberate video loading | Medium |
| P2 | Publication headings have low contrast; controls lack useful semantics | Fix tokens, heading levels, button semantics and accessible labels | Medium |
| P2 | Search duplicates posts and exposes a malformed title | Index posts once; validate front matter; align theme commands | Small |
| P2 | Repository dashboard is stale and mostly images | Put useful repositories first; date metrics and refresh intentionally | Small–medium |
| P2 | Performance workflow measures the upstream demo | Run checks against this site and representative templates | Small |
| P3 | Draft research/project/blog additions need integration and evidence | Curate the information architecture and editorial backlog | Medium |

## Content freshness by area

| Area | Current state | What should change |
| --- | --- | --- |
| Homepage | Outdated current role. Latest-post list reaches July 2026; selected papers include 2026 work. | Lead with Rennes/ISTIC, IRISA/Taran and current research. Add clear routes to papers, software, teaching and CV. |
| Publications | 18 entries; the 20 relevant HAL records include two additional posters. | Add the missing entries and reconcile names, dates, versions, ordering and categories. |
| Web CV | Current role starts August 2026; includes summer-school teaching and recent posters. | Fix contact actions, ARITH coverage, publication duplication and date inconsistencies. |
| PDF CV | Live download exactly matches the local file; generated 24 August 2026. Current role is correct. | Remove “Scheduled demo” for ARITH; add the co-taught tutorial and links; synchronize citation details. |
| Courses | August MLIR/CIRCT course is present and linked from the official programme. | Add date, level, duration and a consistent resource layout. Consider listing the ARITH tutorial. Fix one missing slide asset. |
| Projects | Four live projects: OSFNTC, SUF, POF and Le RetrOrchestre. Six more exist locally. | Present recent compiler/software work and contribution status with consistent cards and detail pages. |
| Repositories | Six SVG metric panels; summary asset says last updated 26 December 2025. | Show curated repositories and releases before metrics. Distinguish your repositories, contributions and repositories you starred. |
| Blog | Eight live posts; latest July 2026. Six additional local posts are already written. | Fix archive/search metadata, then develop selected drafts with figures, code and reproducible evidence. |
| Research / tapeouts / software / talks / impact | Five untracked pages exist locally and return 404 on the live site. | Integrate selectively; update their April-era content and verify numerical claims before publishing. |
| Utility pages | Empty news page, leftover submenu route, explicit unpublished OPC test page. | Exclude unused pages from sitemap/search. Keep the OPC page unpublished until it is ready. |
| Bitmosh | Privacy page and three September 2026 review pages are live. Review pages deliberately use a standalone layout and noindex. | Preserve their separate purpose; audit their links and layout without forcing the academic navigation onto them. No legal-content review was performed. |

### Homepage

[about.md](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_pages/about.md:19) describes you as a postdoctoral researcher in Emeraude. [resume.json](/home/lledoux/Documents/work/repositories/bynaryman.github.io/assets/json/resume.json:43) and the PDF instead identify your Associate Professor appointment at Université de Rennes / ISTIC, with research in IRISA D3 / Inria Taran, from August 2026.

A suitable opening, based on the existing CV, would be:

> I am Louis Ledoux, Associate Professor (Maître de conférences) at Université de Rennes / ISTIC and a member of the Inria Taran team at IRISA. My research connects computer arithmetic, compiler transformations and efficient hardware architectures, from tensor kernels to silicon.

Then briefly describe the current CAMELIA / AI-accelerator work and the compiler-to-silicon thread. Keep the art/music and Ada material, with less competition between the biography, long technical paragraph, bold emphasis and external links.

Other changes:

- Replace the BSC “work” social destination in [_config.yml](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_config.yml:105) with the current institutional/team destination. BSC remains appropriate in your employment history.
- Put the role and research description before the large portrait on phones. The inspected mobile portrait block occupied roughly 528px vertically before the following text.
- Explicitly order selected work. It currently starts with FPL 2023 before the 2026 entries.
- Separate current programmes from historical tapeout participation. Describe completed MPW work in the past tense and link concrete artefacts.
- Verify the attribution and wording of the Latin quotation before retaining it as a sourced quotation; its accuracy was not established in this audit.
- Replace the theme-derived meta description, which still contains raw Markdown and an al-folio design reference, with a short research/profile description.

### Publications: exact reconciliation

The bibliography covers all journal/conference papers found in the relevant HAL result set. The confirmed coverage gap is two posters, not two missing peer-reviewed papers.

| Item | Evidence / discrepancy | Action |
| --- | --- | --- |
| **HAriCo: Floating-Point MLIR to CIRCT Datapaths** | HAL `hal-05725118v1`, 10 August 2026. Present in web/PDF CV, absent from BibTeX. CV points to the general school page. | Add a poster entry and link the HAL record/document from the CV. [HAL record](https://hal.science/hal-05725118) |
| **Multi-Level Compilation of AI Tensors and Activation Functions to Silicon** | HAL `hal-05671676v1`, 22 June 2026. Present in CV, absent from bibliography. | Add the PEPR IA Days poster. [HAL record](https://hal.science/hal-05671676) |
| **Reconfigurable Constant Multipliers** | BibTeX says **Baptiste Barbe**; HAL, Crossref and the coauthor bibliography say **Bastien Barbe**. Crossref records volume 122, article 105270 and June 2026 print publication; HAL uses March 2026. | Correct the author; add final publication metadata; distinguish publication-date meanings. Do not use the spurious September shown on the homepage. [Crossref metadata](https://api.crossref.org/works/10.1016/j.micpro.2026.105270), [coauthor bibliography](https://perso.citi-lab.fr/fdedinec/recherche/f2d.html) |
| **Frugalité…** | BibTeX says **Matthieu Popoff**, omits French accents and abbreviates the author list with `others`. Publisher/coauthor records identify **Maxime Popoff**. HAL dates it December 2025; the site displays September. | Correct name/title, restore the full author list, and reconcile author order against the final article. Publisher-page and HAL author ordering differ, so avoid blindly importing either. [Publisher](https://revues.mshparisnord.fr/rfim/index.php?id=961) |
| **Florent de Dinechin** | Correct particle exists in BibTeX, but the template prints only first/last components, producing “Florent Dinechin.” | Preserve name particles in both normal and expanded author displays. [_layouts/bib.liquid](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_layouts/bib.liquid:84) |
| **EuroLLVM 2026 poster / DSD 2025 division paper** | HAL currently reports version 2 for `hal-05576131` and `hal-05385247`; local `HAL_VERSION` is v1. | Update version metadata and verify PDF links against current records. |
| **EuroLLVM 2025 poster** | Bibliography/HAL order is Cochard, Forget, de Dinechin, Ledoux. CV lists Ledoux first. | Preserve publication author order in the CV. |
| **Holigrail talk/report** | Site/CV put Ledoux before Cochard; HAL lists Cochard before Ledoux. It appears under “Posters” because it is `@misc`. | Verify credit order against the slides; classify under talks/reports. |
| **MLIR Workshop 2026 communication** | Filed under “Posters,” despite being a workshop communication. | Give talks/tutorials their own category. |
| **WiPiEC journal link** | Venue badge points to `www.wep-journal.org`, which failed DNS resolution during the audit. | Use the actual [journal article page](https://wipiec.digitalheritage.me/index.php/wipiecjournal/article/view/90). |
| **Dates and ordering** | 2026 posters render April, April, May, January; 2025 talks/posters render April before September. | Sort within categories by actual date; retain genuine unknown month values. |

There is also a **rendering defect** in [_layouts/bib.liquid](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_layouts/bib.liquid:147): `entrymonth` is assigned only when an entry has a month, without clearing it for the next entry. The same RCM item shows “Sep 2026” on the homepage but only “2026” on the publications page. RFIM inherits September from the preceding entry. Reset per-entry values before rendering.

HAL browser pages sometimes blocked automated retrieval, but its public search API returned the records successfully. Treat external 403 responses as inaccessible to this check, not proof of broken links. The snapshot of the relevant HAL records is retained with the evidence.

### CV and teaching

The CV is considerably more current than the homepage. Keep it as the starting point for the refresh.

- **Broken contact destinations:** the web CV generates `mailto:i.f.lledoux[at]gmail.com` and a `tel:` URL containing `[seven]`. Preserve display obfuscation if desired, but use valid destinations or plain non-clickable text. [_includes/resume/basics.liquid](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_includes/resume/basics.liquid:20)
- **ARITH:** the PDF still says “Scheduled demo.” Both formats should mention the completed tutorial co-run with Sam Coward on 27 June, its resources, and the demo as separate activities. The [existing ARITH post](https://bynaryman.github.io/blog/2026/arith-2026-circt-tutorial-demo/) already provides the material.
- **August teaching:** confirmed in the official [ACM school programme](https://mlir-school.github.io/summer-2026/program/), 13 August, 16:00–17:45. This deserves a homepage highlight or concise news item.
- **Dates requiring your confirmation:** JSON has PhD end date `2024-08-03`, while HAL gives the thesis date as 2 October 2024. Distinguish completion, defence and deposit dates. Some INSA teaching entries run through December 2026 although the postdoc ended in July; verify whether these represent the calendar year or actual teaching dates.
- **Rendering loses information:** the education template does not display the existing `summary`, so the thesis title/supervisor details in JSON do not appear there.
- **Presentation:** “Label,” “Url,” and “Summary” expose data-field names in the public Basics table. Prefer a compact profile header. CV sections jump from H1 to H3 to H6, with prose marked as headings.
- **PDF:** all four pages were inspected. The document is readable, with no obvious clipping. One journal entry spills onto page 3 above the next section; improve this break when regenerating. It is an untagged PDF, so the HTML CV should remain the primary accessible version.
- **Data drift:** the same publications exist in BibTeX, a general JSON `publications` array, specialized JSON arrays and the separately generated PDF. Use stable publication IDs and one authoritative record per item. The PDF's editable source is not present in this repository.
- **Template residue:** [_data/cv.yml](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_data/cv.yml:1) still contains Albert Einstein's sample CV. It is currently an unused fallback, not the live CV. Remove/replace it to avoid accidental exposure if the JSON data path changes.

## Style, consistency and usability

The default Modus/light palette already gives the site an identifiable technical character. Most academic pages share a shell, navigation and footer. The issue is accumulated exceptions and uneven hierarchy.

1. **Fix the tablet navigation first.** At a 768px requested viewport (753px content width), the search control extended to approximately x=799 and the theme control to x=849. The hamburger was hidden because `navbar-expand-sm` expands too early. Global horizontal clipping masks the overflow. Collapse at a suitable larger breakpoint and test the longer local “research” navigation too. [_includes/header.liquid](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_includes/header.liquid:3)

2. **Make theme choice persist.** Reproduced: choose Dark on Courses, navigate to CV, and the page becomes Light. `initTheme()` calls `setThemeSetting(themeSetting, false)`, clearing the user-override flag; the next theme computation returns the default. Search also offers “Use system default theme,” although the resolver accepts only light/dark. [theme.js](/home/lledoux/Documents/work/repositories/bynaryman.github.io/assets/js/theme.js:239)

3. **Separate text colors from divider colors.** Project categories and bibliography section headings use `--global-divider-color` as text. This is visibly faint; the inspected Binary-dark heading was `rgba(226,195,153,0.26)`. Use a real secondary-text token and verify contrast in each supported theme. Reference: [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). [_base.scss](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_sass/_base.scss:628)

4. **Normalize page rhythm.** The desktop shell adds 6rem top padding on top of the fixed header/content margins. Main titles begin around 200px from the top in the inspected desktop views. Reduce the empty lead-in, use one heading scale, and standardize descriptions, section spacing, card padding and action buttons.

5. **Set a comfortable reading width.** The site uses a 1200px maximum container for both dashboards and long prose. Keep grids/CV wide where useful, but constrain biography and article text to a readable measure. Retain the retro font as an optional theme or heading accent; evaluate long technical prose separately from navigation and code.

6. **Standardize project content.** OSFNTC is a long research write-up; other live pages and new local pages vary considerably in depth and imagery. Use: purpose → your contribution → current status → one visual → outcomes → paper/code/demo links. Keep image proportions consistent and choose useful thumbnail descriptions.

7. **Improve keyboard and assistive access.** Publication Abs/Bib actions are anchors without `href` or keyboard focus; “more authors” is a click-only span. Use buttons with expanded state. Give icon links, theme control and CV download descriptive accessible names. Replace filename alt text such as `prof_pic.jpg` and `hal-05510936.png`. Add a skip-to-content link and semantic heading order. These are confirmed markup issues, not a claim of complete WCAG assessment.

8. **Keep typography and editorial conventions deliberate.** Lowercase navigation is coherent; internal headings mix several capitalization styles. Normalize dates, “SystemVerilog,” “Tiny Tapeout,” units such as µm², and English/French publication titles. Keep original publication titles; label translations explicitly.

9. **Refactor style ownership.** [_retro.scss](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_sass/_retro.scss:1) has 2,157 lines and 170 `!important` declarations layered over Bootstrap/MDB/theme styles. Consolidate tokens, layout, typography and component rules before adding more overrides. This is mainly a maintenance issue; the delivered local main stylesheet itself is only about 11KB gzip.

10. **Repair search metadata.** Each of the eight live posts appears twice: once from `site.posts`, once from `site.collections`. Searching Music/DJ produces two results titled `["Music/DJ set"]` because that post's YAML title is an array. Index each document once and quote the intended title as a string. [_includes/scripts/search.liquid](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_includes/scripts/search.liquid:75)

## Performance findings

Sizes use decimal MB/KB. Image totals are source files referenced by the page, not proof that all were downloaded immediately. Lazy loading, caching, range requests and compression affect real transfer.

| Resource / observation | Measured size | Why it matters / recommended action |
| --- | ---: | --- |
| Shared favicon `8087_art.jpg` | **3,724,646 bytes** | Excessive for a browser icon. Generate small favicon sizes and keep the artwork separately. |
| RetrOrchestre GIF | **9,602,806 bytes** | Used on the projects listing. Use a static preview and an optional MP4/WebM animation with controls. |
| Four sticker-post PNGs | **35,789,481 bytes total** | Serve optimized responsive images; keep originals behind deliberate download links. |
| Project listing image references | **11,055,094 bytes total** | Most of the total is the GIF. Resize diagram thumbnails while preserving readable full-size figures. |
| Homepage portrait | **434,200 bytes**, 1536px intrinsic width | Good candidate for responsive sizes and modern formats. |
| ROM / Ada videos | **29,836,253 / 12,622,685 bytes** | Both posts request autoplay/loop. Prefer a poster and user-triggered playback; choose preload deliberately. |
| Homepage direct CSS/JS URLs | **20 script tags, 7 stylesheet tags; 2,852,904 decoded bytes fetched** | Includes math, badges, analytics and framework libraries; excludes module imports/fonts/subrequests. Gate unused functionality. |
| MathJax / Dimensions badge script | **809,059 / 533,262 decoded bytes** | Load only on pages with math or actual badge elements. Both are currently included globally. |
| Tabler general / outline WOFF2 files | **804,560 / 730,124 bytes on disk** | Large icon fonts for a few controls. Determine the actually used face and subset it or use SVG icons. This is potential cost, not measured font transfer. |
| Production output | **301,890,028 bytes** | Repository/deployment bulk, not visitor page weight. Remove unused demo assets and avoid deploying source utilities. |

Additional technical findings:

- **Responsive conversion is disabled.** `imagemagick.enabled: false` means the shared figure include never emits WebP sources. Make image generation reproducible in CI or commit generated variants. Do not merely flip the switch without supplying the build dependency.
- **Image dimensions are not intrinsic dimensions.** Shared markup commonly uses `width="100%"` and `height="auto"`, which do not establish the HTML intrinsic aspect ratio. Use numeric width/height or a matching CSS aspect ratio, then size responsively. This explains a layout-shift risk; CLS was not measured.
- **CSS cache invalidation is broken.** The live URL ends in `d41d8cd98f00b204e9800998ecf8427e`, the MD5 of empty content. [_plugins/cache-bust.rb](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_plugins/cache-bust.rb:45) hashes nonexistent `assets/_sass`; the actual directory is `_sass`. Styles can remain cached after changes.
- **Page-level scripts:** MathJax, Masonry/imagesLoaded, badge libraries, Jupyter helpers and other utilities appear on pages without their corresponding features. Keep a minimal shared bundle and opt into enhancements.
- **Fonts:** Google Fonts requests Roboto, Roboto Slab and Material Icons, while the custom themes use different font stacks. Remove unneeded stylesheet requests after checking actual use. A `defer` attribute on a stylesheet link does not make it nonblocking.
- **Analytics configuration disagrees with behavior.** `enable_google_analytics: false` is bypassed by a hardcoded gtag block in [_layouts/default.liquid](/home/lledoux/Documents/work/repositories/bynaryman.github.io/_layouts/default.liquid:6). Make one configuration path authoritative; decide intentionally whether analytics should load.
- **Metrics:** light/dark image tags reference the same six SVG files, and several are explicitly eager. Avoid duplicate DOM, reserve dimensions and defer below-fold content. Browsers can deduplicate identical URLs, so do not count the duplicate markup as twice the transfer.
- **No animated-background performance claim:** the active layout includes a simple binary-background element. Much of the elaborate terminal animation code is unused. Profile actual painted effects before optimizing inactive CSS.

Suggested future acceptance budgets: compact favicon assets; responsive thumbnails; no unused math/badge scripts on text pages; deliberate loading for videos; stable image boxes. Establish real mobile Lighthouse and Web Vitals baselines after the first fixes before setting a site-wide transfer target.

## Links, build quality and maintenance

### Confirmed link defects

The blog's prominent filter bar links to four nonexistent archives:

- `/blog/tag/systolic-algorithms`
- `/blog/tag/floats`
- `/blog/tag/math`
- `/blog/category/artistic-science`

The content actually uses categories such as `science`, `arte-science` and `music`. Generate the filter list from real taxonomy, or validate configured filters during the build.

Other findings:

- Sitemap advertises `/_pages/dropdown/`, which returns 404. Remove the unused submenu example.
- The summer-school deck references missing `assets/images/arithmetic/e4m3-rewrite-exponent-question.svg`; confirmed absent locally and HTTP 404 live. Course assets are excluded from existing link-check workflows, so this escaped those checks.
- The proposed Emeraude-MLIR project points to a GitHub repository returning 404 to unauthenticated visitors. The existing public TinyTapeout repository describes that compiler as not yet open. Label availability accurately and link public demonstrators until the repository is public.
- The live Discord URL ends in `…120`, while the local configured ID ends in `…121`. Treat long identifiers as strings and check the YAML-update/deployment path for numeric rounding.
- The 404 document redirects to the homepage after three seconds. Prefer a stable explanation and useful links so visitors can recover deliberately.

### Build results

The initial production attempt failed because `jupyter` was not on PATH. Retrying with the repository's existing `.venv/bin` succeeded, without installing or changing dependencies.

| Build | Result |
| --- | --- |
| Production, existing virtualenv on PATH | Success, **238.972 seconds** |
| Development, same environment | Success, **12.435 seconds** |
| Generated development HTML link scan | 108 HTML files; the four bad filters and one missing course SVG identified |

This is a single local comparison, not a controlled benchmark. It suggests investigating production minification first; it does not establish an exact speedup or prove which individual file dominates.

Both builds warned about:

- Colliding `art`, `videos` and `retro` archive paths. Commas embedded in whitespace-separated tag strings create distinct raw tags that slugify to the same URL. The generated `videos` archive contained only the Manim post, omitting other video-tagged posts.
- Liquid parsing BibTeX double braces inside the OSFNTC project page. Wrap literal BibTeX in raw blocks.
- Sass import/function deprecations.
- Non-content files such as `scripts/` and `requirements.txt` being copied into output.

### Automated checks

- [.github/workflows/lighthouse-badger.yml](/home/lledoux/Documents/work/repositories/bynaryman.github.io/.github/workflows/lighthouse-badger.yml:16) still audits `https://alshedivat.github.io/al-folio/`. Existing report files are for that demo, not this site.
- Axe testing is manual-only. It does not currently protect routine changes across the site.
- Deploy and link-check path filters omit `_bibliography/**/*.bib`, so a bibliography-only commit does not match the deployment trigger. Add bibliography changes explicitly.
- Existing source and generated link checks skip course content, which contains the confirmed missing image.
- Metrics generation is manual-only. The dashboard therefore cannot be assumed current from the footer's “Last updated” date.
- The footer date reflects the site build, not the last editorial review of each page.
- Pin tooling and document a single local verification command. Avoid updating the entire dependency stack as part of cosmetic fixes without checking template behavior.

## Existing local additions and blog readiness

There are **17 pre-existing untracked content files**: five research pages, six project pages and six posts. They are not part of the live site at audit time. The six posts live in `_posts`, are dated in April, and have no `published: false` flag: committing them will make them publishable on the next build.

Before integrating the research pages:

- Replace planning-oriented prose such as “research/navigation additions” with visitor-facing descriptions.
- Derive the research-page publication count from data: it currently says 17, the bibliography has 18, and the reconciled relevant HAL list has 20.
- Give each tapeout an explicit status: contribution, submitted, fabricated, received or measured. Distinguish the two IHP designs from the number of shuttles.
- Add source links and experimental conditions for the impact page's 1,000+ layouts, 13.4% area reduction, and related numerical claims.
- Update the talks page with FDF, PEPR IA Days, ARITH and summer-school material.
- Avoid adding every new page to top-level navigation. A research/software landing page can organize tapeouts, tools and selected outcomes.

The existing draft posts give a useful backlog:

| Draft | What it needs before publication |
| --- | --- |
| Codez for Annotated Research Figures | One compelling before/after figure, a tested minimal example, current package version and licence/reuse information. |
| Layout Feedback That Changed the Optimizer | Cite the paper/data behind 2404→2081 µm² and 1.36×; explain methodology and include a plot. |
| MLIR Loop to Silicon With Visible Arithmetic | A concrete IR transformation and result; distinguish its purpose from the existing March TinyTapeout article. |
| IHP accumulator variants | Status, matched comparison conditions, measured or estimated results, and clear limitations. |
| OpenROAD Placement as a Visual Medium | A short optimized animation, source configuration and explanation of the experiment. |
| SUF as a Reproducible Software-to-Silicon Instrument | A reproducible command/configuration example and one resulting report or design comparison. |

For the next new articles, the most useful sequence would be: **Rennes role/research update**, **a practical Codez walkthrough**, then **the layout-feedback case study**. Consider a summer-school teaching recap if it can add resources or lessons beyond the course listing.

Use one post convention: title, description, real publication date, optional updated date, normalized category/tags, cover image with alt text, and explicit math/media requirements. Add useful social previews before promotion; Open Graph and structured metadata are currently disabled. RSS already exists, so expose a feed link rather than adding a new publishing system.

## Recommended implementation sequence

1. **Content correctness:** role/affiliation, valid CV actions, bibliography reconciliation, updated ARITH entries, missing posters, contact/work links.
2. **Functional repairs:** navbar breakpoint, theme persistence, taxonomy collisions, search duplication, missing course image, CSS cache hashing and bibliography deployment trigger.
3. **Visual and performance pass:** shared typography/spacing, contrast and controls, favicon, responsive media, script/font loading and metrics presentation.
4. **Editorial integration:** curate the six project additions and research landing page, then publish improved blog posts individually.

Validate the resulting pass on homepage, publications, CV, project grid/detail, blog index/post and course landing/deck at phone/tablet/desktop widths. Include theme persistence across navigation, keyboard controls, real contact destinations, rendered-link checks, publication counts/dates, and Lighthouse runs against the correct site.

Content decisions still needing your input are limited to facts the sources do not settle: the exact PhD milestone date, current Rennes teaching/service additions, the present status of each tapeout, and whether the research compiler can be linked publicly.
