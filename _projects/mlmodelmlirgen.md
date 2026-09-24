---
layout: page
title: MLModelMLIRGEN
description: Batch export utility from PyTorch models to MLIR linalg-on-tensors artifacts
img: assets/img/projects/mlmodelmlirgen.svg
img_alt: Pipeline diagram from PyTorch models through torch-mlir to linalg-on-tensors.
importance: 5
category: work
github: https://github.com/Bynaryman/MLModelMLIRGEN
github_stars: Bynaryman/MLModelMLIRGEN
---

`MLModelMLIRGEN` is a utility project used to export curated PyTorch and `torchvision` models into reusable MLIR artifacts.

## Scope

- Batch conversion through `torch-mlir`.
- Export of model variants and pretrained weights for reproducible compilation studies.
- Target level focused on `linalg-on-tensors` to keep the transformation pipeline analyzable.

## Role In The Stack

This is the model-ingestion front-end for arithmetic-lowering experiments. It helps benchmark the exact same model family across compiler pipelines instead of re-authoring kernels by hand.

## Links

- Repository: <https://github.com/Bynaryman/MLModelMLIRGEN>
- Related publication entry: [HAL 05385229](https://hal.science/hal-05385229)
