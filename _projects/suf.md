---
layout: page
title: SUF
description: Python orchestration for reproducible OpenROAD experiments
img: assets/img/SUF.png
importance: 2
category: work
github: https://github.com/Bynaryman/SUF
---

SUF orchestrates OpenROAD experiments from Python. A graph of actions and dependencies describes each scenario; asynchronous execution schedules independent work and collects implementation results for comparison.

{% include figure.liquid path="assets/img/SUF.png" alt="Overview of the SUF experiment flow." %}

## Flow configuration

SUF uses an external OpenROAD-flow-scripts checkout. Point it at the flow directory:

```sh
export SUF_FLOW_ROOT=/path/to/OpenROAD-flow-scripts/flow
```

OpenROAD and Yosys can be found on `PATH` or selected with `SUF_OPENROAD_EXE` and `SUF_YOSYS_CMD`. Optional HDL translation tools are configured separately. The README describes the environment variables and repository setup.

This separation lets experiments reuse an installed EDA toolchain while Python manages the design variants, run dependencies, and plots. The setup remains a research workflow; reproducing a result requires its scenario and tool versions.

## Publication

Louis Ledoux and Marc Casas, _The Grafted Superset Approach: Bridging Python to Silicon with Asynchronous Compilation and Beyond_, OSDA at DATE, Valencia, 25 March 2024.

[HAL record](https://hal.science/hal-04587458) · [Poster](https://hal.science/hal-04587458/document)
