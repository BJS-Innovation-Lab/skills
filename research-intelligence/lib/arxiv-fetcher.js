/**
 * arXiv API Fetcher
 * Fetches recent papers from arXiv based on categories and keywords
 */

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

/**
 * Fetch papers from arXiv
 * @param {Object} options - Fetch options
 * @param {string[]} options.categories - arXiv categories (e.g., ['cs.AI', 'cs.LG'])
 * @param {string[]} options.keywords - Search keywords
 * @param {number} options.maxResults - Maximum papers to fetch
 * @param {number} options.daysBack - How many days back to search
 * @returns {Promise<Array>} Array of paper objects
 */
async function fetchArxivPapers({ categories = [], keywords = [], maxResults = 100, daysBack = 1 }) {
  // Build category query
  const categoryQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
  
  // Build keyword query
  const keywordQuery = keywords.length > 0 
    ? keywords.map(kw => `all:${kw}`).join(' OR ')
    : '';
  
  // Combine queries
  let searchQuery = categoryQuery;
  if (keywordQuery) {
    searchQuery = `(${categoryQuery}) AND (${keywordQuery})`;
  }
  
  // Build URL
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: 0,
    max_results: maxResults,
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  });
  
  const url = `${ARXIV_API_URL}?${params.toString()}`;
  
  console.log(`[arXiv] Fetching: ${url}`);
  
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Parse XML response
    const papers = parseArxivResponse(xmlText);
    
    // Filter by date if needed
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const recentPapers = papers.filter(paper => {
      const publishedDate = new Date(paper.published);
      return publishedDate >= cutoffDate;
    });
    
    console.log(`[arXiv] Found ${recentPapers.length} papers from last ${daysBack} day(s)`);
    
    return recentPapers;
  } catch (error) {
    console.error('[arXiv] Fetch error:', error);
    throw error;
  }
}

/**
 * Parse arXiv XML response
 * @param {string} xmlText - Raw XML response
 * @returns {Array} Parsed paper objects
 */
function parseArxivResponse(xmlText) {
  const papers = [];
  
  // Simple XML parsing (for Node.js, consider using xml2js in production)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1];
    
    const paper = {
      source: 'arxiv',
      source_id: extractTag(entry, 'id').replace('http://arxiv.org/abs/', ''),
      title: extractTag(entry, 'title').replace(/\s+/g, ' ').trim(),
      abstract: extractTag(entry, 'summary').replace(/\s+/g, ' ').trim(),
      published: extractTag(entry, 'published'),
      updated: extractTag(entry, 'updated'),
      authors: extractAuthors(entry),
      categories: extractCategories(entry),
      pdf_url: extractPdfUrl(entry)
    };
    
    papers.push(paper);
  }
  
  return papers;
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAuthors(entry) {
  const authors = [];
  const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
  let match;
  
  while ((match = authorRegex.exec(entry)) !== null) {
    authors.push({ name: match[1].trim() });
  }
  
  return authors;
}

function extractCategories(entry) {
  const categories = [];
  const catRegex = /<category[^>]*term="([^"]+)"/g;
  let match;
  
  while ((match = catRegex.exec(entry)) !== null) {
    categories.push(match[1]);
  }
  
  return categories;
}

function extractPdfUrl(entry) {
  const linkRegex = /<link[^>]*href="([^"]+)"[^>]*title="pdf"/i;
  const match = entry.match(linkRegex);
  return match ? match[1] : null;
}

module.exports = { fetchArxivPapers };
