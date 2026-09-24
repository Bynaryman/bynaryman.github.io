# Site maintenance

This is a Jekyll site deployed to GitHub Pages. Keep site changes in this repository; do not edit the generated `_site` directory.

## Build and verify

Use Ruby with Bundler, Node.js 22+, and Python 3. Install the locked dependencies:

```sh
bundle install
npm ci
npm run check
```

`npm run check` tests theme persistence, builds production HTML, purges unused CSS, and validates internal links, assets, anchors, duplicate IDs, homepage script exclusions, and unpublished blog drafts. Standalone course assets are included in link validation. Jupyter is unnecessary for the current published pages; the theme's example notebook is excluded.

Preview the result:

```sh
python3 -m http.server 4001 --directory _site
```

Check the homepage, publications, CV, projects, courses, and blog at desktop, tablet, and phone widths. Test both palettes, light/dark/system mode, navigation, search, and publication disclosures. Accessibility runs on pull requests through Axe; Lighthouse uploads reports for the actual deployed site after deployment or a manual run. Neither report is a substitute for visual and keyboard checks.

## Publications and CV

`_bibliography/papers.bib` is the source for publication metadata. Use `article` for journals, `inproceedings` for conference papers, `misc` for posters, and `techreport` for deposited talks/seminars. Supply the publication month explicitly when known. HAL `/document` links follow the latest deposited version.

CV entries in `assets/json/resume.json` refer to bibliography keys through `bibkey`. `_plugins/cv_bibliography.rb` resolves titles, authors, venues, dates, and links during the build; missing keys fail the build. Other CV sections remain in JSON. List posters separately from peer-reviewed papers.

The PDF source is maintained in the sibling `my_CV` repository, `my_cv.tex`. The September 2026 corrections are also recorded in `_audit/2026-09-24/cv-source.patch`. Regenerate with LuaLaTeX twice in that repository, inspect every PDF page, then copy the result to `assets/pdf/LEDOUX_LOUIS_CV.pdf`. A site build does not regenerate the PDF.

## Images and video

Responsive WebP assets and their manifests are committed. To regenerate after adding or changing images, install Pillow 12.3.0 and ffmpeg, then run:

```sh
python3 scripts/optimize_images.py
```

The script reads image references from authored Markdown and publication previews, generates variants and video posters, and creates the favicon. Keep original images for explicit zoom/download. Use `figure.liquid` with meaningful alt text and a `sizes` hint; reserve eager loading for an image visible on initial load. Use `video.liquid` for controls, a poster, and no automatic preload or playback.

The RetrOrchestre video was converted from the existing GIF with:

```sh
ffmpeg -i assets/img/retrorchestre.gif -vf scale=720:-2 -movflags +faststart -pix_fmt yuv420p assets/video/retrorchestre.mp4
```

## Blog editorial boundary

The six April 16–21, 2026 draft files are explicitly excluded in `_config.yml`. Remove an exclusion only when its article has been reviewed for publication. This pass does not revise existing blog prose. The shared metadata/rendering hook fixes comma-separated tags, array titles, and Markdown captions without editing those articles.

Write future articles concisely: state the problem, method, evidence, and limitations. Preserve exact publication titles and distinguish a design submission, fabrication, and measured silicon results.
