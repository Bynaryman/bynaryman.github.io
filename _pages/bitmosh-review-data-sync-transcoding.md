---
layout: bitmosh-review
title: "Data sync: media transcoding"
permalink: /bitmosh/review/data-sync-transcoding/
nav: false
sitemap: false
search: false
device: "HONOR NTH-NX9 phone · Android 13 (API 33) · Installed through Google Play"
video: /assets/bitmosh/review/data-sync-transcoding.mp4
---

## What the recording shows

1. The original bundled **Signal garden** project is open.
2. The user opens **Preview** and selects **Full project**, with Exact quality.
3. Bitmosh decodes and processes the clips locally, then encodes the preview.
4. Rendering progress and an in-app **Cancel** control are visible.
5. The completed preview plays inside Bitmosh.

## Why the service is used

This is a user-initiated render, not a scheduled sync. Delaying it prevents the
requested preview from appearing; interrupting it requires starting the render
again. Saved project edits are retained.

Bitmosh uses `dataSync` for this local processing on Android versions below 15.
The foreground service stops after completion, cancellation or failure. No network
upload, download or cloud backup is involved.

The phone's notification shade is not opened in this recording to avoid exposing
unrelated personal notifications.
