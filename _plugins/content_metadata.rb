# Normalize legacy metadata without rewriting the articles.
Jekyll::Hooks.register :site, :post_read do |site|
  site.posts.docs.each do |post|
    post.data['title'] = Array(post.data['title']).join(' ')
    %w[tags categories].each do |key|
      post.data[key] = Array(post.data[key]).flat_map { |s| s.split(',') }.map(&:strip).reject(&:empty?).uniq
    end
  end
  site.config['display_tags'] = site.posts.docs.flat_map { |p| p.data['tags'] }.uniq.sort
  site.config['display_categories'] = site.posts.docs.flat_map { |p| p.data['categories'] }.uniq.sort
end

Jekyll::Hooks.register [:pages, :documents], :pre_render do |doc|
  doc.data['math'] ||= doc.content.match?(/\$\$|\\\(|\\\[/)
  # Legacy HTML captions contain Markdown. Opt these containers into Kramdown,
  # with block parsing and unindented text so they do not become code blocks.
  doc.content = doc.content.gsub(/(<div\b[^>]*class="[^"]*\bcaption\b[^"]*"[^>]*>)(.*?)(<\/div>)/m) do
    opening, text, closing = Regexp.last_match.captures
    opening = opening.sub(/>$/, ' markdown="1">') unless opening.include?('markdown=')
    "#{opening}\n#{text.lines.map(&:strip).join("\n")}\n#{closing}"
  end
end
