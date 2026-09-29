---
layout: page
title: MLModelMLIRGEN
description: Export torchvision models and model suites to MLIR linalg-on-tensors.
img: assets/img/projects/python.svg
img_alt: Python logo, the implementation language of MLModelMLIRGEN.
importance: 5
category: work
github: https://github.com/Bynaryman/MLModelMLIRGEN
github_stars: Bynaryman/MLModelMLIRGEN
img_style: tool-logo
---

MLModelMLIRGEN exports PyTorch and torchvision classification models to MLIR using torch-mlir. The output is `linalg-on-tensors`, suitable for compiler experiments that need a reproducible model input.

## Export a model

The default exporter produces ResNet-18. Options select the model, weights, number of classes, input dimensions, and exported function name.

```sh
python scripts/resnet18_to_mlir.py --output resnet18.mlir
```

A second script exports predefined suites. It can list the available suites or show the intended exports without compiling them:

```sh
python scripts/export_model_suites.py --list
python scripts/export_model_suites.py --suite toy --dry-run
python scripts/export_model_suites.py --suite sota_imagenet --output-root mlir_outputs/sota
```

The repository includes examples from ResNet, MobileNet, SqueezeNet, EfficientNet, and ConvNeXt. Its README specifies the matching PyTorch, torchvision, and torch-mlir versions used for validation; those versions matter because the exporter depends on their APIs and lowering support.
