---
layout: default
permalink: /blog/
title: blog
nav: true
nav_order: 1
pagination:
  enabled: true
  collection: posts
  permalink: /page/:num/
  per_page: 5
  sort_field: date
  sort_reverse: true
  trail:
    before: 1 # The number of links before the current page
    after: 3 # The number of links after the current page
---

<div class="post">

{% assign blog_name_size = site.blog_name | size %}
{% assign blog_description_size = site.blog_description | size %}

{% if blog_name_size > 0 or blog_description_size > 0 %}

  <div class="header-bar blog-index-header">
    <h1>{{ site.blog_name }}</h1>
    <p>{{ site.blog_description }}</p>
  </div>
  {% endif %}

{% if site.display_tags or site.display_categories %}

  <details class="blog-topics">
    <summary>Browse by topic</summary>
    <div class="tag-category-list">
    <ul class="p-0 m-0">
      {% for tag in site.display_tags %}
        <li>
          <i class="fa-solid fa-hashtag fa-sm"></i> <a href="{{ tag | slugify | prepend: '/blog/tag/' | relative_url }}">{{ tag }}</a>
        </li>
        {% unless forloop.last %}
          <li aria-hidden="true">&bull;</li>
        {% endunless %}
      {% endfor %}
      {% if site.display_categories.size > 0 and site.display_tags.size > 0 %}
        <li aria-hidden="true">&bull;</li>
      {% endif %}
      {% for category in site.display_categories %}
        <li>
          <i class="fa-solid fa-tag fa-sm"></i> <a href="{{ category | slugify | prepend: '/blog/category/' | relative_url }}">{{ category }}</a>
        </li>
        {% unless forloop.last %}
          <li aria-hidden="true">&bull;</li>
        {% endunless %}
      {% endfor %}
    </ul>
    </div>
  </details>
  {% endif %}

{% assign featured_posts = site.posts | where: "featured", true %}
{% if featured_posts.size > 0 %}
  <h2 class="accent-heading">Featured posts</h2>
  <ul class="post-cards post-cards--latest">
    {% for post in featured_posts %}
      <li>{% include post_card.liquid post=post compact=true heading='h3' %}</li>
    {% endfor %}
  </ul>
{% endif %}

{% if page.pagination.enabled %}
  {% assign postlist = paginator.posts %}
{% else %}
  {% assign postlist = site.posts %}
{% endif %}
<ul class="post-cards">
  {% for post in postlist %}
    <li>{% include post_card.liquid post=post %}</li>
  {% endfor %}
</ul>

{% if page.pagination.enabled %}
  {% include pagination.liquid %}
{% endif %}
</div>
