---
layout: post
title: My Take on Manim Slides
date: 2024-10-19 19:00:00
description: "Exploring Manim Slides for interactive website embedding and dynamic presentations."
tags: videos, science, communication, mathematics
categories: science
---

Manim, short for **Math Animation**, might not be immediately recognizable to everyone.
However, if I mention **3Blue1Brown** (3b1b), it may ring a bell.
If not, I highly recommend exploring the incredible collection of videos produced by **3Blue1Brown**, where advanced mathematics is beautifully presented through dynamic, intuitive visualizations.
These videos demonstrate a compelling way to **teach**, **illustrate**, **animate**, and **explain** mathematics in various engaging forms.

Even if mathematics isn’t your passion, the framework and concepts that **Grant Sanderson (the creator of 3b1b)** has developed are awe-inspiring.
From transformations to visual storytelling, Manim makes abstract concepts accessible in a visually engaging way.

### Three Video Examples with Liquid Integration
<div class="row mt-5">
    <div class="col-sm mt-3 mt-md-0">
        {% include video.liquid path="https://youtu.be/9-Jl0dxWQs8?si=MD8rODoS4fzLUWgq" class="img-fluid rounded z-depth-2" controls=true autoplay=false %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include video.liquid path="https://youtu.be/pQa_tWZmlGs?si=STULp4fFBZ5lLWFZ" class="img-fluid rounded z-depth-2" controls=true autoplay=false %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include video.liquid path="https://youtu.be/r6sGWTCMz2k?si=ZayrqQk3PMveKUp6" class="img-fluid rounded z-depth-2" controls=true autoplay=false %}
    </div>
</div>

<div class="caption">
    Above are three examples of Manim animations showcasing different aspects of visual mathematics, all generated using Manim and rendered directly on the web.
</div>

### Discovering Manim for Myself

It may come as a surprise that it is only recently that I learned the entire **Manim** environment is available to the public as an open-source project. This discovery was an invitation for me to dive deeper into its capabilities.

There are currently two notable versions of Manim available:

- [Manim Community Edition](https://www.manim.community/) - Actively developed and maintained by the **Manim community** on GitHub, featuring continuous enhancements and new contributions. 
- [Manim GL](https://github.com/3b1b/manim) - Maintained by **3Blue1Brown**, focusing on the original vision for the animations featured in his popular YouTube channel.

Both versions serve different purposes, yet share a common objective—bringing mathematical concepts to life in a beautifully visual way.

### Integrating Manim with Presentations and Websites

Naturally, after exploring Manim, I wanted to push the boundaries and see how it could be used in interactive presentations and website embedding. That's when I discovered **Manim Slides**. This tool extends Manim with the ability to create the iconic 3b1b-style animations, now embedded into **slides with pauses** between key scenes—exportable in formats like **HTML** or **PDF**.

This functionality bridges the gap between animation and interactive learning, making it possible to create dynamic visual experiences for live presentations, educational content, or blog embedding.

### Interactive Slide Example

<div class="row mt-5">
    <div class="col-sm mt-3 mt-md-0">
        <div style="position:relative; padding-bottom:56.25%;" class="img-fluid rounded z-depth-2">
            <iframe
                style="width:100%; height:100%; position:absolute; left:0; top:0;"
                frameborder="0"
                allowfullscreen
                allow="autoplay"
                src="/assets/html/iframe.html">
            </iframe>
        </div>
    </div>
</div>

<div class="caption">
    These interactive slides demonstrate animations rendered in Python + Manim from 3Blue1Brown. Use your keyboard arrows to navigate through the presentation and explore the animations step by step.
</div>

### Conclusion

Manim and its extensions offer a powerful way to bring mathematics and abstract concepts to life.
The combination of **beautiful animations** with **interactive slide formats** opens up new possibilities for teaching, communicating complex ideas, and engaging an audience visually.

I look forward to exploring **Manim Beamer** next—a tool even more promising in terms of flexibility and suiting my usual flow based on Beamer. 
For now, I'm enjoying learning how to use **Manim Slides** to create immersive and interactive experiences.

If you're curious, be sure to check out the links above and try creating your own animations with Manim.
The possibilities are endless.