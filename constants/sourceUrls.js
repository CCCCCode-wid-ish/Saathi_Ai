window.SOURCE_URLS = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  wikipedia: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  snopes: (q) => `https://www.snopes.com/search/${encodeURIComponent(q)}`,
  factcheck: (q) => `https://www.factcheck.org/?s=${encodeURIComponent(q)}`,
  wolframalpha: (q) => `https://www.wolframalpha.com/input?i=${encodeURIComponent(q)}`,
  pubmed: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
};
