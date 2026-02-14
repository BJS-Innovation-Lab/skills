/**
 * Semantic Scholar API Client
 * Fetches papers from Semantic Scholar's Academic Graph API
 */

const S2_API_URL = 'https://api.semanticscholar.org/graph/v1';

/**
 * Search for papers on Semantic Scholar
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
 * @param {string[]} options.fields - Fields of study filter
 * @param {number} options.limit - Maximum results
 * @param {number} options.year - Minimum publication year
 * @returns {Promise<Array>} Array of paper objects
 */
async function searchSemanticScholar({ query, fields = [], limit = 100, year = null }) {
  const params = new URLSearchParams({
    query: query,
    limit: Math.min(limit, 100), // API max is 100
    fields: 'paperId,title,abstract,authors,year,publicationDate,fieldsOfStudy,openAccessPdf,citationCount'
  });
  
  if (fields.length > 0) {
    params.append('fieldsOfStudy', fields.join(','));
  }
  
  if (year) {
    params.append('year', `${year}-`);
  }
  
  const url = `${S2_API_URL}/paper/search?${params.toString()}`;
  
  console.log(`[S2] Searching: ${query}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`S2 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const papers = (data.data || []).map(paper => ({
      source: 'semantic_scholar',
      source_id: paper.paperId,
      title: paper.title,
      abstract: paper.abstract || '',
      published: paper.publicationDate || `${paper.year}-01-01`,
      authors: (paper.authors || []).map(a => ({ name: a.name })),
      categories: paper.fieldsOfStudy || [],
      pdf_url: paper.openAccessPdf?.url || null,
      citation_count: paper.citationCount || 0
    }));
    
    console.log(`[S2] Found ${papers.length} papers for "${query}"`);
    
    return papers;
  } catch (error) {
    console.error('[S2] Search error:', error);
    throw error;
  }
}

/**
 * Fetch papers by multiple keyword groups
 * @param {Object} keywordGroups - Object with group names and keyword arrays
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Deduplicated array of papers
 */
async function fetchByKeywordGroups(keywordGroups, { limit = 50, year = null } = {}) {
  const allPapers = [];
  const seenIds = new Set();
  
  for (const [groupName, keywords] of Object.entries(keywordGroups)) {
    // Combine keywords into a query
    const query = keywords.join(' OR ');
    
    try {
      const papers = await searchSemanticScholar({ query, limit, year });
      
      // Deduplicate
      for (const paper of papers) {
        if (!seenIds.has(paper.source_id)) {
          seenIds.add(paper.source_id);
          paper.keyword_group = groupName;
          allPapers.push(paper);
        }
      }
      
      // Rate limiting - S2 has 100 requests per 5 minutes
      await sleep(500);
    } catch (error) {
      console.error(`[S2] Error fetching group "${groupName}":`, error.message);
    }
  }
  
  return allPapers;
}

/**
 * Get paper details by ID
 * @param {string} paperId - Semantic Scholar paper ID
 * @returns {Promise<Object>} Paper details
 */
async function getPaperDetails(paperId) {
  const fields = 'paperId,title,abstract,authors,year,publicationDate,fieldsOfStudy,openAccessPdf,citationCount,references,citations';
  const url = `${S2_API_URL}/paper/${paperId}?fields=${fields}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`S2 API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[S2] Error fetching paper ${paperId}:`, error);
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { searchSemanticScholar, fetchByKeywordGroups, getPaperDetails };
