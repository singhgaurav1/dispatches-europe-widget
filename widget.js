/**
 * Dispatches Europe AI Search Widget
 * ========================================
 * A beautiful AI-powered search widget for WordPress
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Replace with your actual API endpoint
        searchEndpoint: '/wp-json/dispatches-europe/v1/search',
        trendingEndpoint: '/wp-json/dispatches-europe/v1/trending',
        scrollSpeed: 25, // seconds for one complete scroll cycle
        enableAnalytics: true
    };

    // DOM Elements
    let searchInput, searchButton, trendingTrack, chips;

    /**
     * Initialize the widget
     */
    function init() {
        // Cache DOM elements
        searchInput = document.getElementById('search-input');
        searchButton = document.getElementById('search-button');
        trendingTrack = document.getElementById('trending-track');
        chips = document.querySelectorAll('.chip');

        // Set up event listeners
        setupEventListeners();

        // Initialize infinite scroll for trending articles
        setupInfiniteScroll();

        // Optionally load dynamic trending articles
        // loadTrendingArticles();
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Search button click
        searchButton.addEventListener('click', handleSearch);

        // Enter key in search input
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });

        // Chip clicks
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query;
                searchInput.value = query;
                handleSearch();
            });
        });

        // Trending article clicks
        trendingTrack.addEventListener('click', (e) => {
            const card = e.target.closest('.trending-card');
            if (card) {
                handleArticleClick(card);
            }
        });
    }

    /**
     * Handle search action
     */
    function handleSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            searchInput.focus();
            shakeElement(searchInput.parentElement);
            return;
        }

        // Track search analytics
        if (CONFIG.enableAnalytics) {
            trackEvent('search', { query });
        }

        // Option 1: Redirect to search results page
        // window.location.href = `/search?q=${encodeURIComponent(query)}`;

        // Option 2: Open in modal/overlay (implement your own)
        // openSearchResults(query);

        // Option 3: Make API call (for SPA behavior)
        performAISearch(query);
    }

    /**
     * Perform AI-powered search via API
     */
    async function performAISearch(query) {
        console.log('🔍 Searching for:', query);
        
        // Show loading state
        searchButton.disabled = true;
        searchButton.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>';

        try {
            // Replace this with your actual API call
            // Example using WordPress REST API:
            /*
            const response = await fetch(`${CONFIG.searchEndpoint}?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) throw new Error('Search failed');
            
            const results = await response.json();
            displayResults(results);
            */

            // Simulated API response for demo
            await simulateAPICall(1500);
            
            // For demo: redirect to search page
            alert(`AI Search would process: "${query}"\n\nIn production, this would call your AI search API.`);

        } catch (error) {
            console.error('Search error:', error);
            showError('Search failed. Please try again.');
        } finally {
            // Reset button state
            searchButton.disabled = false;
            searchButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    }

    /**
     * Handle trending article click
     */
    function handleArticleClick(card) {
        const title = card.querySelector('.card-title').textContent;
        
        // Track analytics
        if (CONFIG.enableAnalytics) {
            trackEvent('trending_click', { title });
        }

        // Option 1: Navigate to article (add data-url to cards)
        // const url = card.dataset.url;
        // if (url) window.location.href = url;

        // Option 2: Use title as search query
        searchInput.value = title;
        handleSearch();
    }

    /**
     * Set up infinite scroll by duplicating content
     */
    function setupInfiniteScroll() {
        if (!trendingTrack) return;

        // Clone all cards for seamless infinite scroll
        const cards = trendingTrack.querySelectorAll('.trending-card');
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            trendingTrack.appendChild(clone);
        });

        // Adjust animation duration based on content width
        const totalWidth = trendingTrack.scrollWidth / 2;
        const duration = totalWidth / 50; // pixels per second
        trendingTrack.style.animationDuration = `${duration}s`;
    }

    /**
     * Load trending articles from WordPress API
     */
    async function loadTrendingArticles() {
        try {
            const response = await fetch(CONFIG.trendingEndpoint);
            if (!response.ok) throw new Error('Failed to load trending articles');
            
            const articles = await response.json();
            renderTrendingArticles(articles);
            setupInfiniteScroll();
        } catch (error) {
            console.error('Error loading trending articles:', error);
        }
    }

    /**
     * Render trending articles from API data
     */
    function renderTrendingArticles(articles) {
        if (!trendingTrack || !articles.length) return;

        const categoryClasses = {
            'remote-work': 'category-work',
            'healthcare': 'category-healthcare',
            'finance': 'category-finance',
            'housing': 'category-housing',
            'visa': 'category-visa'
        };

        trendingTrack.innerHTML = articles.map(article => `
            <article class="trending-card" data-url="${article.url}" data-id="${article.id}">
                <span class="card-category ${categoryClasses[article.category] || 'category-visa'}">
                    ${article.categoryName}
                </span>
                <h3 class="card-title">${escapeHtml(article.title)}</h3>
            </article>
        `).join('');
    }

    /**
     * Utility: Escape HTML entities
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utility: Shake animation for validation feedback
     */
    function shakeElement(element) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'shake 0.5s ease';
        
        // Add shake keyframes if not exists
        if (!document.getElementById('shake-keyframes')) {
            const style = document.createElement('style');
            style.id = 'shake-keyframes';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Utility: Show error message
     */
    function showError(message) {
        // Simple alert for demo - replace with your own notification system
        console.error(message);
    }

    /**
     * Utility: Track analytics events
     */
    function trackEvent(eventName, data) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }

        // WordPress/custom analytics
        console.log('📊 Analytics:', eventName, data);
    }

    /**
     * Utility: Simulate API call delay (for demo only)
     */
    function simulateAPICall(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API for external use
    window.DispatchesEuropeWidget = {
        search: (query) => {
            searchInput.value = query;
            handleSearch();
        },
        refresh: loadTrendingArticles
    };

})();


