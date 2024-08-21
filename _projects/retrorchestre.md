---
layout: page
title: Le RetrOrchestre
description: "These 'Ts' and 'Rs' forming such a 'melodic' alliteration should already give you a strong hint of what is going on"
img: assets/img/retrorchestre.gif
importance: 1
category: fun
---

## Demo
Normally the cool stuff is here so I can catch your curiosity. Video / YT incoming ?

## Introduction

Transform your old computer's parts (and not only) into midi instrument.
list of features

## Technical Part
For me, the cool stuff is here

### Interfacing with DAWs (Reaper / linux ATM)

#### Serial Arduinos (mini pro, micro)
plug the arduino and verify with dmesg to which device it is mapped
map with midi2serial/usb with ttymidi -s /dev/ttyUSB0 -b 115200 -v
check all the instruments with aconnect -l
map 2 of them (reaper out ttymidi in) with aconnect 129:0 128:1 for instance

#### USB Arduinos (due)
connect the board to native usb port.
reaper should see the arduino as midi device directly

