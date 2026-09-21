---
layout: bitmosh-review
title: "Media processing: transcoding and cancellation"
permalink: /bitmosh/review/media-processing/
nav: false
sitemap: false
search: false
device: "Android 16 (API 36) emulator · APK generated from the version-13 release bundle"
video: /assets/bitmosh/review/media-processing.mp4
---

## What the recording shows

1. The user opens **Export** for the original bundled **Signal garden** project.
2. The user confirms the export to start decoding, processing and encoding locally.
3. The notification shade shows **Bitmosh · rendering on this phone**, a progress
   indicator and **Cancel** while the app is covered by the shade.
4. The completed export plays in Bitmosh and is marked **Saved to gallery**.
5. The user starts another export and taps **Cancel** in its foreground notification.
6. The render notification disappears and Bitmosh shows **Cancelled**.

## Why the service is used

Bitmosh uses the `mediaProcessing` foreground-service type on Android 15 and newer.
The recorded device is an Android 16 emulator, not the physical Android 13 phone
used in the separate data-sync demonstrations.

The render is explicitly requested by the user. Deferring it delays the preview
or exported file they are waiting for; interrupting it requires rendering again.
The service stops when the render finishes, fails or is cancelled. Saved project
edits remain intact. Processing is local, without a cloud renderer or network sync.
