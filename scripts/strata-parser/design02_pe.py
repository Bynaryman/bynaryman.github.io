"""Generate a SeaMOS PE map from a matching Design02 layout, powered netlist and array RTL.

Usage: python design02_pe.py layout.gds design.pnl.v array.sv > placement.json
Requires KLayout's Python module. Reuses the paper's exclusive feedback-cone rule.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
import klayout.db as db


def map_placements(layout_path, netlist, rtl):
    cells = {}
    driver = {}
    boundary = set()
    gates = re.findall(r"^\s*(sky130_fd_sc_hd__\w+)\s+(\S+)\s*\((.*?)\);", netlist, re.M | re.S)
    for master, name, body in gates:
        pins = {p: n.strip().replace("\\", "") for p, n in re.findall(r"\.(\w+)\s*\(([^)]*)\)", body)}
        outputs = {pins[p] for p in ("X", "Y", "Q", "Q_N", "LO", "HI") if p in pins}
        for net in outputs:
            if net in driver:
                raise ValueError(f"Multiple drivers for {net}")
            driver[net] = name
        data = [n for p, n in pins.items() if p not in ("VPWR", "VGND", "VPB", "VNB", "CLK") and n not in outputs]
        cells[name] = (master, data)
        if "__" in master and master.split("__")[1].startswith(("df", "sdf", "edf", "dl")) and not any(n.startswith("array_core.") for n in outputs):
            boundary.add(name)

    words = dict(re.findall(r"\bassign (c_[12]_[12]) = (_GEN_\d+);", rtl))
    feedback = {value: reg for reg, value in re.findall(r"\b(n\d+) <= (_GEN_\d+);", rtl)}
    owners = {}
    for i, (column, row) in enumerate(((1, 1), (1, 2), (2, 1), (2, 2)), 1):
        bus = feedback[words[f"c_{row}_{column}"]]
        pending = [driver[f"array_core.{bus}[{b}]"] for b in range(8)]
        seen = set()
        while pending:
            cell = pending.pop()
            if cell in seen or cell in boundary:
                continue
            seen.add(cell)
            pending.extend(driver[n] for n in cells[cell][1] if n in driver)
        for cell in seen:
            owners[cell] = i if cell not in owners else 0
    for i, (column, row) in enumerate(((1, 1), (1, 2), (2, 1), (2, 2)), 1):
        for b in range(8):
            assert owners[driver[f"array_core._v_acc_{column}_{row}_y[{b}]"]] == i

    layout = db.Layout()
    layout.read(layout_path)
    placements = {}
    names = set()
    for inst in layout.cell("tt_um_mmalpha").each_inst():
        t, name = inst.trans, inst.property(61)
        assert not inst.is_regular_array() and cells[name][0] == inst.cell.name and name not in names
        names.add(name)
        origin = t * db.Point(0, 0)
        x, y = t * db.Point(1, 0) - origin, t * db.Point(0, 1) - origin
        key = ",".join(map(str, [inst.cell.name, round(origin.x * layout.dbu * 1000), round(origin.y * layout.dbu * 1000), x.x, x.y, y.x, y.y]))
        assert key not in placements
        placements[key] = owners.get(name, 0)
    assert names == set(cells)
    keys = sorted(placements)
    signature = hashlib.sha256("\n".join(keys).encode()).hexdigest()
    return signature, "".join(str(placements[k]) for k in keys)


if __name__ == "__main__":
    signature, owners = map_placements(sys.argv[1], Path(sys.argv[2]).read_text(), Path(sys.argv[3]).read_text())
    print(json.dumps({signature: owners}, indent=2))
