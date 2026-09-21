---
layout: bitmosh-review
title: "Data sync: exporting"
permalink: /bitmosh/review/data-sync-export/
nav: false
sitemap: false
search: false
device: "HONOR NTH-NX9 phone · Android 13 (API 33) · Installed through Google Play"
video: /assets/bitmosh/review/data-sync-export.mp4
---

## What the recording shows

1. The original bundled **Signal garden** project is open.
2. The user taps **Export** and reviews the format, resolution and quality controls.
3. The user confirms **Export**, requesting a local 720p video render.
4. Bitmosh shows rendering progress and an in-app **Cancel** control.
5. The result appears as **Saved video**, with **Saved to gallery** and a Share button.

## Why the service is used

The service decodes, processes and encodes the selected clips, then writes the
completed MP4 to Android's media library under `Movies/Bitmosh`. This demonstrates
the **exporting** part of the Console's “Importing, exporting” use case.

The operation begins only after the user requests it. Delaying or interrupting it
prevents the requested export from completing. Bitmosh uses `dataSync` on Android
versions below 15 and stops the foreground service on completion, cancellation or
failure. No network transfer or cloud backup is performed.

The phone's notification shade is not opened in this recording to avoid exposing
unrelated personal notifications.
