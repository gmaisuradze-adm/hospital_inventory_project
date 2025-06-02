import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IconPlus,
  IconSearch,
  IconCategory,
  IconArticle,
  IconBookmarks,
  IconStar,
  IconEye,
  IconThumbUp,
  IconThumbDown,
  IconDownload,
  IconShare
} from '@tabler/icons-react';
import { serviceAPI } from '../../core/api/apiService';

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeArticle, setActiveArticle] = useState(null);
  
  useEffect(() => {
    const fetchKnowledgeData = async () => {
      try {
        setLoading(true);
        const { data } = await serviceAPI.getKnowledgeBase();
        setArticles(data?.articles || []);
        
        // Extract unique categories from articles
        if (data?.articles) {
          const uniqueCategories = [...new Set(data.articles.map(article => article.category))];
          setCategories(uniqueCategories);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        setError('Failed to load knowledge base');
        setLoading(false);
        
        // Use mock data as fallback
        setArticles(mockArticles);
        const uniqueCategories = [...new Set(mockArticles.map(article => article.category))];
        setCategories(uniqueCategories);
      }
    };
    
    fetchKnowledgeData();
  }, []);
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };
  
  const handleViewArticle = (article) => {
    setActiveArticle(article);
  };
  
  const handleCloseArticle = () => {
    setActiveArticle(null);
  };
  
  // Filter articles based on search and category
  const filteredArticles = (articles.length > 0 ? articles : mockArticles).filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || 
      article.category === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });
  
  // Mock data if API doesn't return any
  const mockArticles = [
    {
      id: 'KB001',
      title: 'Common Network Connectivity Issues',
      category: 'Network',
      content: `<h2>Common Network Connectivity Issues</h2>
      <p>This article covers the most frequent network connectivity problems encountered in hospital environments and how to troubleshoot them effectively.</p>
      <h3>Symptoms of Network Issues</h3>
      <ul>
        <li>Slow or intermittent connection</li>
        <li>Unable to access specific applications</li>
        <li>Complete loss of connectivity</li>
        <li>Error messages during login</li>
      </ul>
      <h3>Basic Troubleshooting Steps</h3>
      <ol>
        <li>Verify physical connections (cables, power to switches/routers)</li>
        <li>Restart the affected device</li>
        <li>Check for IP address conflicts</li>
        <li>Ensure proper network settings</li>
        <li>Test connectivity with ping and traceroute</li>
      </ol>
      <h3>Advanced Solutions</h3>
      <p>If basic troubleshooting doesn't resolve the issue, consider:</p>
      <ul>
        <li>Checking switch port configuration</li>
        <li>Verifying VLAN assignment</li>
        <li>Testing for layer 2/3 connectivity issues</li>
        <li>Checking firewall and security policies</li>
      </ul>
      <p>For persistent issues, contact the IT Network team at ext. 5500.</p>`,
      tags: ['networking', 'connectivity', 'troubleshooting', 'wifi'],
      author: 'Michael Chen',
      published: '2023-05-15',
      lastUpdated: '2023-06-22',
      viewCount: 345,
      helpful: 42,
      notHelpful: 5
    },
    {
      id: 'KB002',
      title: 'How to Request New Equipment',
      category: 'Procedures',
      content: `<h2>How to Request New Equipment</h2>
      <p>This guide explains the process for requesting new equipment through the hospital's inventory management system.</p>
      <h3>Equipment Request Process</h3>
      <ol>
        <li>Log in to the Hospital Inventory Management Portal</li>
        <li>Navigate to "Requests" > "Create New Request"</li>
        <li>Select "Equipment Request" from the dropdown menu</li>
        <li>Fill in all required fields:
          <ul>
            <li>Equipment type and specifications</li>
            <li>Quantity needed</li>
            <li>Justification for request</li>
            <li>Department and cost center</li>
            <li>Delivery location</li>
          </ul>
        </li>
        <li>Upload any supporting documentation</li>
        <li>Submit the request for approval</li>
      </ol>
      <h3>Approval Process</h3>
      <p>After submission, requests follow this approval workflow:</p>
      <ol>
        <li>Department Head review</li>
        <li>Budget verification</li>
        <li>Procurement team processing</li>
      </ol>
      <h3>Timeline Expectations</h3>
      <p>Standard equipment requests typically take 2-4 weeks to process. Urgent requests must be marked as "High Priority" and may require additional justification.</p>
      <p>For assistance with equipment requests, contact the Procurement team at ext. 4200.</p>`,
      tags: ['procurement', 'equipment', 'requests', 'procedure'],
      author: 'Jennifer Brown',
      published: '2023-04-10',
      lastUpdated: '2023-04-10',
      viewCount: 523,
      helpful: 89,
      notHelpful: 2
    },
    {
      id: 'KB003',
      title: 'Troubleshooting Printer Issues',
      category: 'Hardware',
      content: `<h2>Troubleshooting Printer Issues</h2>
      <p>This guide provides steps for resolving common printer problems encountered in the hospital environment.</p>
      <h3>Common Printer Problems</h3>
      <h4>Paper Jams</h4>
      <ol>
        <li>Open the printer cover carefully</li>
        <li>Remove any visible jammed paper by pulling gently</li>
        <li>Check for and remove any torn pieces of paper</li>
        <li>Close all covers securely before testing</li>
      </ol>
      <h4>Print Quality Issues</h4>
      <ul>
        <li>Streaks or smudges: Clean the print heads/toner drum</li>
        <li>Faded prints: Replace ink/toner cartridge</li>
        <li>Misaligned text: Run printer alignment utility</li>
      </ul>
      <h4>Connection Issues</h4>
      <ol>
        <li>Verify the printer is powered on and connected to the network</li>
        <li>Ensure your computer is connected to the same network</li>
        <li>Try reinstalling printer drivers</li>
        <li>Test direct connection with USB if available</li>
      </ol>
      <h3>When to Contact IT Support</h3>
      <p>Contact the IT Help Desk at ext. 5100 if:</p>
      <ul>
        <li>Error codes appear on the printer display</li>
        <li>Printer is not detected on the network after troubleshooting</li>
        <li>Mechanical noises or burning smells come from the printer</li>
        <li>Print jobs are stuck in the queue and can't be cleared</li>
      </ul>`,
      tags: ['printer', 'hardware', 'troubleshooting'],
      author: 'David Williams',
      published: '2023-03-20',
      lastUpdated: '2023-06-15',
      viewCount: 782,
      helpful: 103,
      notHelpful: 8
    },
    {
      id: 'KB004',
      title: 'Electronic Health Record System Guide',
      category: 'Software',
      content: `<h2>Electronic Health Record System Guide</h2>
      <p>A comprehensive guide to using the hospital's Electronic Health Record (EHR) system effectively.</p>
      <h3>Accessing the EHR System</h3>
      <ol>
        <li>Access via the hospital intranet or desktop shortcut</li>
        <li>Use your hospital credentials to log in</li>
        <li>Enable two-factor authentication when prompted</li>
      </ol>
      <h3>Key Features</h3>
      <h4>Patient Records</h4>
      <p>Access patient information via:</p>
      <ul>
        <li>Patient ID search</li>
        <li>Name search</li>
        <li>Department lists</li>
        <li>Admission date</li>
      </ul>
      <h4>Documentation</h4>
      <p>Record patient information using:</p>
      <ul>
        <li>Progress notes</li>
        <li>Admission forms</li>
        <li>Treatment plans</li>
        <li>Discharge summaries</li>
      </ul>
      <h3>Security Best Practices</h3>
      <ul>
        <li>Never share login credentials</li>
        <li>Always lock your workstation when away</li>
        <li>Only access records of patients under your care</li>
        <li>Report suspicious activities to IT Security</li>
      </ul>
      <h3>Training Resources</h3>
      <p>For additional training, access:</p>
      <ul>
        <li>Video tutorials on the intranet</li>
        <li>Monthly training sessions (schedule on Training Portal)</li>
        <li>Department-specific guides</li>
      </ul>
      <p>For EHR support, contact the Clinical Systems team at ext. 5300.</p>`,
      tags: ['ehr', 'software', 'patient records', 'clinical'],
      author: 'Dr. Sarah Johnson',
      published: '2023-02-10',
      lastUpdated: '2023-05-28',
      viewCount: 1245,
      helpful: 187,
      notHelpful: 12
    },
    {
      id: 'KB005',
      title: 'IT Security Best Practices',
      category: 'Security',
      content: `<h2>IT Security Best Practices</h2>
      <p>Essential security practices for all hospital staff to protect patient data and hospital systems.</p>
      <h3>Password Security</h3>
      <ul>
        <li>Use complex passwords with at least 12 characters</li>
        <li>Include uppercase, lowercase, numbers, and special characters</li>
        <li>Never share passwords with anyone</li>
        <li>Change passwords every 90 days</li>
        <li>Use different passwords for different systems</li>
      </ul>
      <h3>Phishing Awareness</h3>
      <p>To avoid phishing attacks:</p>
      <ul>
        <li>Verify sender email addresses carefully</li>
        <li>Be suspicious of unexpected attachments</li>
        <li>Don't click links in emails from unknown sources</li>
        <li>Report suspicious emails to IT Security</li>
      </ul>
      <h3>Device Security</h3>
      <ul>
        <li>Lock your computer (Windows key + L) when leaving your workstation</li>
        <li>Keep mobile devices password-protected</li>
        <li>Only use hospital-approved USB devices</li>
        <li>Never install unauthorized software</li>
      </ul>
      <h3>Data Protection</h3>
      <ul>
        <li>Only access patient data on a need-to-know basis</li>
        <li>Don't save sensitive data on local drives</li>
        <li>Use encrypted channels for data transfer</li>
        <li>Report potential data breaches immediately</li>
      </ul>
      <h3>Security Contacts</h3>
      <p>For security concerns or to report incidents:</p>
      <ul>
        <li>IT Security Hotline: ext. 5555</li>
        <li>Email: security@hospital.org</li>
        <li>After hours: Contact the on-call IT security officer at 555-123-4567</li>
      </ul>`,
      tags: ['security', 'passwords', 'phishing', 'data protection'],
      author: 'Alex Turner',
      published: '2023-01-15',
      lastUpdated: '2023-06-10',
      viewCount: 956,
      helpful: 145,
      notHelpful: 3
    },
    {
      id: 'KB006',
      title: 'Medical Equipment Maintenance Schedule',
      category: 'Maintenance',
      content: `<h2>Medical Equipment Maintenance Schedule</h2>
      <p>Guidelines for routine maintenance of hospital medical equipment to ensure proper function and compliance.</p>
      <h3>Maintenance Categories</h3>
      <p>Equipment is categorized by risk level and maintenance frequency:</p>
      <table>
        <tr>
          <th>Category</th>
          <th>Risk Level</th>
          <th>Frequency</th>
          <th>Examples</th>
        </tr>
        <tr>
          <td>A</td>
          <td>High</td>
          <td>Monthly</td>
          <td>Ventilators, Defibrillators</td>
        </tr>
        <tr>
          <td>B</td>
          <td>Medium</td>
          <td>Quarterly</td>
          <td>Patient Monitors, Infusion Pumps</td>
        </tr>
        <tr>
          <td>C</td>
          <td>Low</td>
          <td>Semi-Annually</td>
          <td>Examination Tables, Scales</td>
        </tr>
      </table>
      <h3>Maintenance Procedures</h3>
      <ol>
        <li>Regular inspection by Biomedical Engineering</li>
        <li>Calibration of monitoring equipment</li>
        <li>Safety testing of electrical systems</li>
        <li>Manufacturer-recommended servicing</li>
        <li>Documentation of all maintenance activities</li>
      </ol>
      <h3>Requesting Maintenance</h3>
      <p>To schedule maintenance or report equipment issues:</p>
      <ol>
        <li>Submit a service request through the IT Service Portal</li>
        <li>Include equipment ID, location, and issue description</li>
        <li>Indicate urgency level</li>
      </ol>
      <h3>Emergency Repairs</h3>
      <p>For urgent equipment failures that impact patient care:</p>
      <ol>
        <li>Call Biomedical Engineering at ext. 5400</li>
        <li>Remove equipment from service</li>
        <li>Apply "OUT OF SERVICE" tag</li>
        <li>Document incident in the equipment log</li>
      </ol>
      <p>For maintenance questions, contact the Biomedical Engineering team at ext. 5400.</p>`,
      tags: ['maintenance', 'medical equipment', 'calibration', 'repairs'],
      author: 'Robert Johnson',
      published: '2023-02-05',
      lastUpdated: '2023-05-15',
      viewCount: 468,
      helpful: 76,
      notHelpful: 4
    }
  ];
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Knowledge Base</h2>
              <div className="text-muted mt-1">
                {filteredArticles.length} articles in the database
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/service/knowledge/new" className="btn btn-primary d-none d-sm-inline-block">
                  <IconPlus className="icon" />
                  Create Article
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="row">
            <div className="col-lg-3">
              {/* Left sidebar (categories) */}
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">
                    <IconCategory size={20} className="me-2" />
                    Categories
                  </h3>
                </div>
                <div className="list-group list-group-flush">
                  <button
                    className={`list-group-item list-group-item-action ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('all')}
                  >
                    All Categories
                    <span className="badge bg-primary ms-auto">{articles.length || mockArticles.length}</span>
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`list-group-item list-group-item-action ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                      <span className="badge bg-secondary ms-auto">
                        {(articles.length > 0 ? articles : mockArticles).filter(a => a.category === category).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Popular articles */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <IconStar size={20} className="me-2" />
                    Most Viewed Articles
                  </h3>
                </div>
                <div className="list-group list-group-flush">
                  {(articles.length > 0 ? articles : mockArticles)
                    .sort((a, b) => b.viewCount - a.viewCount)
                    .slice(0, 5)
                    .map(article => (
                      <button
                        key={article.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleViewArticle(article)}
                      >
                        <div className="d-flex align-items-center">
                          <IconArticle size={16} className="me-2" />
                          <div className="text-truncate">{article.title}</div>
                        </div>
                        <div className="text-muted small">
                          <IconEye size={14} className="me-1" />
                          {article.viewCount} views
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="col-lg-9">
              {/* Article list or active article view */}
              {activeArticle ? (
                /* Single article view */
                <div className="card">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h3 className="card-title">{activeArticle.title}</h3>
                      <button 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={handleCloseArticle}
                      >
                        Back to List
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex mb-3">
                      <span className={`badge bg-${
                        activeArticle.category === 'Hardware' ? 'red' :
                        activeArticle.category === 'Software' ? 'blue' :
                        activeArticle.category === 'Network' ? 'green' :
                        activeArticle.category === 'Security' ? 'orange' :
                        activeArticle.category === 'Maintenance' ? 'purple' : 'azure'
                      } me-2`}>
                        {activeArticle.category}
                      </span>
                      <div className="text-muted">
                        Published: {new Date(activeArticle.published).toLocaleDateString()}
                      </div>
                      {activeArticle.published !== activeArticle.lastUpdated && (
                        <div className="text-muted ms-3">
                          Updated: {new Date(activeArticle.lastUpdated).toLocaleDateString()}
                        </div>
                      )}
                      <div className="ms-auto">
                        <IconEye size={16} className="me-1" />
                        {activeArticle.viewCount} views
                      </div>
                    </div>
                    <div 
                      className="article-content markdown"
                      dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                    />
                    
                    {/* Tags */}
                    <div className="mt-4 pt-3 border-top">
                      <div className="d-flex flex-wrap">
                        <div className="text-muted me-2">Tags:</div>
                        {activeArticle.tags.map((tag, index) => (
                          <span key={index} className="badge bg-blue-lt me-1 mb-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Author info */}
                    <div className="mt-3 pt-3 border-top">
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-md me-3">
                          {activeArticle.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-weight-medium">{activeArticle.author}</div>
                          <div className="text-muted small">Author</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Article actions */}
                    <div className="mt-4 pt-3 border-top d-flex justify-content-between">
                      <div>
                        <span className="me-2">Was this helpful?</span>
                        <button className="btn btn-outline-success btn-sm me-2">
                          <IconThumbUp size={16} className="me-1" />
                          Yes ({activeArticle.helpful})
                        </button>
                        <button className="btn btn-outline-danger btn-sm">
                          <IconThumbDown size={16} className="me-1" />
                          No ({activeArticle.notHelpful})
                        </button>
                      </div>
                      <div>
                        <button className="btn btn-outline-primary btn-sm me-2">
                          <IconDownload size={16} className="me-1" />
                          Download PDF
                        </button>
                        <button className="btn btn-outline-primary btn-sm">
                          <IconShare size={16} className="me-1" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Articles list view */
                <>
                  {/* Search box */}
                  <div className="card mb-3">
                    <div className="card-body">
                      <div className="input-icon">
                        <span className="input-icon-addon">
                          <IconSearch size={18} stroke={1.5} />
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Search knowledge base..."
                          value={searchQuery}
                          onChange={handleSearch}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Articles grid */}
                  {filteredArticles.length > 0 ? (
                    <div className="row row-cards">
                      {filteredArticles.map(article => (
                        <div key={article.id} className="col-md-6 col-lg-4">
                          <div className="card">
                            <div className="card-header">
                              <h3 className="card-title">
                                <button 
                                  className="article-title-link text-reset" 
                                  onClick={() => handleViewArticle(article)}
                                >
                                  {article.title}
                                </button>
                              </h3>
                            </div>
                            <div className="card-body">
                              <div className="d-flex align-items-center mb-2">
                                <span className={`badge bg-${
                                  article.category === 'Hardware' ? 'red' :
                                  article.category === 'Software' ? 'blue' :
                                  article.category === 'Network' ? 'green' :
                                  article.category === 'Security' ? 'orange' :
                                  article.category === 'Maintenance' ? 'purple' : 'azure'
                                } me-auto`}>
                                  {article.category}
                                </span>
                                <div className="text-muted">
                                  <IconEye size={16} className="me-1" />
                                  {article.viewCount}
                                </div>
                              </div>
                              <p className="text-muted">
                                {article.content.replace(/<[^>]*>?/gm, '').substr(0, 120)}...
                              </p>
                            </div>
                            <div className="card-footer">
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm me-2">
                                  {article.author.charAt(0)}
                                </div>
                                <div className="me-auto text-muted">
                                  <span className="text-reset">{article.author}</span>
                                </div>
                                <div className="text-muted">
                                  {new Date(article.published).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="mt-2">
                                <button 
                                  className="btn btn-primary w-100" 
                                  onClick={() => handleViewArticle(article)}
                                >
                                  Read Article
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card">
                      <div className="card-body text-center py-4">
                        <div className="empty">
                          <div className="empty-icon">
                            <IconBookmarks size={24} />
                          </div>
                          <p className="empty-title">No articles found</p>
                          <p className="empty-subtitle text-muted">
                            Try adjusting your search or filter to find what you're looking for.
                          </p>
                          <div className="empty-action">
                            <button 
                              className="btn btn-primary" 
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                              }}
                            >
                              Clear filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default KnowledgeBase;
