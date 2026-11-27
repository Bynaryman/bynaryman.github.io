// Exact cell names from the SKY130 HD and IHP SG13G2 typical-corner Liberty libraries.
// Sequential entries have ff, latch, statetable or integrated clock-gate definitions.
// Combinational entries have an output function. Unlisted names remain unclassified.
const types = new Map();
function add(prefix, type, suffixes) {
  for (const suffix of suffixes.trim().split(/\s+/)) types.set(prefix + suffix, type);
}
add(
  "sky130_fd_sc_hd__",
  1,
  `
dfbbn_1 dfbbn_2 dfbbp_1 dfrbp_1 dfrbp_2 dfrtn_1 dfrtp_1 dfrtp_2 dfrtp_4 dfsbp_1 dfsbp_2 dfstp_1 dfstp_2 dfstp_4 dfxbp_1 dfxbp_2
dfxtp_1 dfxtp_2 dfxtp_4 dlclkp_1 dlclkp_2 dlclkp_4 dlrbn_1 dlrbn_2 dlrbp_1 dlrbp_2 dlrtn_1 dlrtn_2 dlrtn_4 dlrtp_1 dlrtp_2 dlrtp_4
dlxbn_1 dlxbn_2 dlxbp_1 dlxtn_1 dlxtn_2 dlxtn_4 dlxtp_1 edfxbp_1 edfxtp_1 lpflow_inputisolatch_1 sdfbbn_1 sdfbbn_2 sdfbbp_1
sdfrbp_1 sdfrbp_2 sdfrtn_1 sdfrtp_1 sdfrtp_2 sdfrtp_4 sdfsbp_1 sdfsbp_2 sdfstp_1 sdfstp_2 sdfstp_4 sdfxbp_1 sdfxbp_2 sdfxtp_1
sdfxtp_2 sdfxtp_4 sdlclkp_1 sdlclkp_2 sdlclkp_4 sedfxbp_1 sedfxbp_2 sedfxtp_1 sedfxtp_2 sedfxtp_4
`
);
add(
  "sky130_fd_sc_hd__",
  2,
  `
a2111o_1 a2111o_2 a2111o_4 a2111oi_0 a2111oi_1 a2111oi_2 a2111oi_4 a211o_1 a211o_2 a211o_4 a211oi_1 a211oi_2 a211oi_4 a21bo_1
a21bo_2 a21bo_4 a21boi_0 a21boi_1 a21boi_2 a21boi_4 a21o_1 a21o_2 a21o_4 a21oi_1 a21oi_2 a21oi_4 a221o_1 a221o_2 a221o_4 a221oi_1
a221oi_2 a221oi_4 a222oi_1 a22o_1 a22o_2 a22o_4 a22oi_1 a22oi_2 a22oi_4 a2bb2o_1 a2bb2o_2 a2bb2o_4 a2bb2oi_1 a2bb2oi_2 a2bb2oi_4
a311o_1 a311o_2 a311o_4 a311oi_1 a311oi_2 a311oi_4 a31o_1 a31o_2 a31o_4 a31oi_1 a31oi_2 a31oi_4 a32o_1 a32o_2 a32o_4 a32oi_1
a32oi_2 a32oi_4 a41o_1 a41o_2 a41o_4 a41oi_1 a41oi_2 a41oi_4 and2_0 and2_1 and2_2 and2_4 and2b_1 and2b_2 and2b_4 and3_1 and3_2
and3_4 and3b_1 and3b_2 and3b_4 and4_1 and4_2 and4_4 and4b_1 and4b_2 and4b_4 and4bb_1 and4bb_2 and4bb_4 buf_1 buf_12 buf_16 buf_2
buf_4 buf_6 buf_8 bufbuf_16 bufbuf_8 bufinv_16 bufinv_8 clkbuf_1 clkbuf_16 clkbuf_2 clkbuf_4 clkbuf_8 clkdlybuf4s15_1
clkdlybuf4s15_2 clkdlybuf4s18_1 clkdlybuf4s18_2 clkdlybuf4s25_1 clkdlybuf4s25_2 clkdlybuf4s50_1 clkdlybuf4s50_2 clkinv_1 clkinv_16
clkinv_2 clkinv_4 clkinv_8 clkinvlp_2 clkinvlp_4 conb_1 dlygate4sd1_1 dlygate4sd2_1 dlygate4sd3_1 dlymetal6s2s_1 dlymetal6s4s_1
dlymetal6s6s_1 ebufn_1 ebufn_2 ebufn_4 ebufn_8 einvn_0 einvn_1 einvn_2 einvn_4 einvn_8 einvp_1 einvp_2 einvp_4 einvp_8 fa_1 fa_2
fa_4 fah_1 fahcin_1 fahcon_1 ha_1 ha_2 ha_4 inv_1 inv_12 inv_16 inv_2 inv_4 inv_6 inv_8 lpflow_clkbufkapwr_1 lpflow_clkbufkapwr_16
lpflow_clkbufkapwr_2 lpflow_clkbufkapwr_4 lpflow_clkbufkapwr_8 lpflow_clkinvkapwr_1 lpflow_clkinvkapwr_16 lpflow_clkinvkapwr_2
lpflow_clkinvkapwr_4 lpflow_clkinvkapwr_8 lpflow_inputiso0n_1 lpflow_inputiso0p_1 lpflow_inputiso1n_1 lpflow_inputiso1p_1
lpflow_isobufsrc_1 lpflow_isobufsrc_16 lpflow_isobufsrc_2 lpflow_isobufsrc_4 lpflow_isobufsrc_8 lpflow_isobufsrckapwr_16
lpflow_lsbuf_lh_hl_isowell_tap_1 lpflow_lsbuf_lh_hl_isowell_tap_2 lpflow_lsbuf_lh_hl_isowell_tap_4 lpflow_lsbuf_lh_isowell_4
lpflow_lsbuf_lh_isowell_tap_1 lpflow_lsbuf_lh_isowell_tap_2 lpflow_lsbuf_lh_isowell_tap_4 macro_sparecell maj3_1 maj3_2 maj3_4
mux2_1 mux2_2 mux2_4 mux2_8 mux2i_1 mux2i_2 mux2i_4 mux4_1 mux4_2 mux4_4 nand2_1 nand2_2 nand2_4 nand2_8 nand2b_1 nand2b_2
nand2b_4 nand3_1 nand3_2 nand3_4 nand3b_1 nand3b_2 nand3b_4 nand4_1 nand4_2 nand4_4 nand4b_1 nand4b_2 nand4b_4 nand4bb_1 nand4bb_2
nand4bb_4 nor2_1 nor2_2 nor2_4 nor2_8 nor2b_1 nor2b_2 nor2b_4 nor3_1 nor3_2 nor3_4 nor3b_1 nor3b_2 nor3b_4 nor4_1 nor4_2 nor4_4
nor4b_1 nor4b_2 nor4b_4 nor4bb_1 nor4bb_2 nor4bb_4 o2111a_1 o2111a_2 o2111a_4 o2111ai_1 o2111ai_2 o2111ai_4 o211a_1 o211a_2
o211a_4 o211ai_1 o211ai_2 o211ai_4 o21a_1 o21a_2 o21a_4 o21ai_0 o21ai_1 o21ai_2 o21ai_4 o21ba_1 o21ba_2 o21ba_4 o21bai_1 o21bai_2
o21bai_4 o221a_1 o221a_2 o221a_4 o221ai_1 o221ai_2 o221ai_4 o22a_1 o22a_2 o22a_4 o22ai_1 o22ai_2 o22ai_4 o2bb2a_1 o2bb2a_2
o2bb2a_4 o2bb2ai_1 o2bb2ai_2 o2bb2ai_4 o311a_1 o311a_2 o311a_4 o311ai_0 o311ai_1 o311ai_2 o311ai_4 o31a_1 o31a_2 o31a_4 o31ai_1
o31ai_2 o31ai_4 o32a_1 o32a_2 o32a_4 o32ai_1 o32ai_2 o32ai_4 o41a_1 o41a_2 o41a_4 o41ai_1 o41ai_2 o41ai_4 or2_0 or2_1 or2_2 or2_4
or2b_1 or2b_2 or2b_4 or3_1 or3_2 or3_4 or3b_1 or3b_2 or3b_4 or4_1 or4_2 or4_4 or4b_1 or4b_2 or4b_4 or4bb_1 or4bb_2 or4bb_4
probe_p_8 probec_p_8 xnor2_1 xnor2_2 xnor2_4 xnor3_1 xnor3_2 xnor3_4 xor2_1 xor2_2 xor2_4 xor3_1 xor3_2 xor3_4
`
);
add(
  "sg13g2_",
  1,
  `
dfrbp_1 dfrbp_2 dfrbpq_1 dfrbpq_2 dlhq_1 dlhr_1 dlhrq_1 dllr_1 dllrq_1 lgcp_1 sdfbbp_1 sdfrbp_1 sdfrbp_2 sdfrbpq_1 sdfrbpq_2
slgcp_1
`
);
add(
  "sg13g2_",
  2,
  `
a21o_1 a21o_2 a21oi_1 a21oi_2 a221oi_1 a22oi_1 and2_1 and2_2 and3_1 and3_2 and4_1 and4_2 buf_1 buf_16 buf_2 buf_4 buf_8
dlygate4sd1_1 dlygate4sd2_1 dlygate4sd3_1 ebufn_2 ebufn_4 ebufn_8 einvn_2 einvn_4 einvn_8 inv_1 inv_16 inv_2 inv_4 inv_8 mux2_1
mux2_2 mux4_1 nand2_1 nand2_2 nand2b_1 nand2b_2 nand3_1 nand3b_1 nand4_1 nor2_1 nor2_2 nor2b_1 nor2b_2 nor3_1 nor3_2 nor4_1 nor4_2
o21ai_1 or2_1 or2_2 or3_1 or3_2 or4_1 or4_2 tiehi tielo xnor2_1 xor2_1
`
);

export function logicType(name) {
  return types.get(name) ?? 0;
}
