require 'digest'
module Jekyll
  module CacheBust
    def bust_file_cache(url)
      site = @context.registers[:site]
      path = File.join(site.source, url.sub(%r{^.*?(?=assets/)}, ''))
      File.file?(path) ? "#{url}?#{Digest::SHA256.file(path).hexdigest[0, 16]}" : url
    end
    def bust_css_cache(url)
      site = @context.registers[:site]
      paths = Dir[File.join(site.source, '_sass', '**', '*.scss')].sort
      paths << File.join(site.source, 'assets/css/main.scss')
      digest = Digest::SHA256.new
      paths.each { |path| digest.update(File.read(path)) }
      digest.update(site.config['max_width'].to_s)
      "#{url}?#{digest.hexdigest[0, 16]}"
    end
  end
end
Liquid::Template.register_filter(Jekyll::CacheBust)
