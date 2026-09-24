require 'bibtex'
class CvBibliography < Jekyll::Generator
  safe true
  priority :low
  def generate(site)
    bibliography = BibTeX.open(File.join(site.source, '_bibliography/papers.bib'))
    bibliography.replace_strings.join_strings
    site.data['bibliography_count'] = bibliography.entries.size
    resume = site.data['resume']
    return unless resume
    %w[journals conference_papers posters invited_talks tutorials].each do |section|
      Array(resume[section]).each do |item|
        next unless item['bibkey']
        entry = bibliography[item['bibkey']]
        raise "Missing CV bibliography entry: #{item['bibkey']}" unless entry
        plain = ->(key) { entry[key].to_s.delete('{}') }
        item['name'] = plain.call(:title)
        item['url'] = entry[:doi] ? "https://doi.org/#{plain.call(:doi)}" : plain.call(:url)
        item['publisher'] = [:journal, :booktitle, :howpublished].map { |k| plain.call(k) }.find { |v| !v.empty? }.to_s
        item['summary'] = entry.author.map { |a| [a.first, a.prefix, a.last, a.suffix].compact.join(' ') }.join(', ') + '.'
        month = %w[jan feb mar apr may jun jul aug sep oct nov dec].index(plain.call(:month)[0,3].downcase)
        item['releaseDate'] = plain.call(:year) + (month ? format('-%02d', month + 1) : '')
      end
    end
  end
end
