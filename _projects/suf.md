---
layout: page
title: SUF
description: Python orchestration for reproducible OpenROAD experiments
img: assets/img/SUF.png
importance: 2
category: work
---

SUF orchestrates OpenROAD experiments from Python, including HDL generation, parallel runs across process design kits, and collection of implementation results.

## Workflow

SUF coordinates design generation, implementation runs, and result analysis around [OpenROAD](https://github.com/The-OpenROAD-Project/OpenROAD). It supports comparisons across designs and process design kits, with Python scripts managing parallel execution and collecting results.

{% include figure.liquid path="assets/img/SUF.png" class="img-fluid" alt="Overview of the SUF experiment flow" %}

## Source and documentation

The [repository](https://github.com/Bynaryman/SUF) contains setup instructions, the flow configuration, and analysis scripts.

```bash
git clone --recurse-submodules https://github.com/Bynaryman/SUF.git
```

See the repository README for dependencies and commands appropriate to the current version.

## Publication

Louis Ledoux and Marc Casas, _The Grafted Superset Approach: Bridging Python to Silicon with Asynchronous Compilation and Beyond_, OSDA at DATE, Valencia, 25 March 2024.

[HAL record](https://hal.science/hal-04587458) · [Poster](https://hal.science/hal-04587458/document)

## Contributing

Report issues or propose changes through the repository. Include the relevant design, flow configuration, and tool versions when reporting a reproducibility problem.

## License

Academic Free License, version 3.0.
