# Dispatches Europe AI Search Widget

A beautiful, modern AI-powered search widget designed for WordPress sites focused on European expat content.

![Widget Preview](preview.png)

## 📁 Files Included

- `index.html` - Demo page with the widget
- `widget.css` - All styling (CSS custom properties for easy theming)
- `widget.js` - Interactive functionality

## 🚀 Quick Start

1. Open `index.html` in a browser to preview the widget
2. Customize colors in `widget.css` (CSS variables at the top)
3. Follow WordPress integration steps below

---

## 🔌 WordPress Integration

### Option 1: Custom HTML Block (Simplest)

1. Copy the widget HTML from `index.html` (the `<div class="dispatches-europe-widget">` section)
2. In WordPress editor, add a **Custom HTML** block
3. Paste the widget HTML
4. Enqueue the CSS and JS files in your theme

```php
// Add to your theme's functions.php
function dispatches_europe_widget_assets() {
    wp_enqueue_style(
        'dispatches-europe-widget',
        get_template_directory_uri() . '/assets/css/widget.css',
        array(),
        '1.0.0'
    );
    
    wp_enqueue_script(
        'dispatches-europe-widget',
        get_template_directory_uri() . '/assets/js/widget.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'dispatches_europe_widget_assets');
```

### Option 2: WordPress Shortcode (Recommended)

Create a shortcode for easy reuse:

```php
// Add to functions.php or custom plugin
function dispatches_europe_widget_shortcode($atts) {
    ob_start();
    include get_template_directory() . '/templates/dispatches-europe-widget.php';
    return ob_get_clean();
}
add_shortcode('dispatches_europe_search', 'dispatches_europe_widget_shortcode');
```

Then use `[dispatches_europe_search]` anywhere in your content.

### Option 3: Elementor/Page Builder Widget

Create a custom Elementor widget or use the HTML widget with embedded styles.

---

## 🤖 Implementing AI Search

### Recommended Approach: OpenAI + WordPress REST API

#### 1. Create Custom REST API Endpoint

```php
// In your theme's functions.php or a custom plugin

add_action('rest_api_init', function() {
    register_rest_route('dispatches-europe/v1', '/search', array(
        'methods' => 'GET',
        'callback' => 'dispatches_europe_ai_search',
        'permission_callback' => '__return_true',
        'args' => array(
            'q' => array(
                'required' => true,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
});

function dispatches_europe_ai_search($request) {
    $query = $request->get_param('q');
    
    // Step 1: Get relevant posts using WordPress search
    $posts = get_posts(array(
        's' => $query,
        'post_type' => 'post',
        'posts_per_page' => 10,
        'post_status' => 'publish'
    ));
    
    // Step 2: Prepare context for AI
    $context = array_map(function($post) {
        return array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'excerpt' => wp_trim_words($post->post_content, 100),
            'url' => get_permalink($post->ID)
        );
    }, $posts);
    
    // Step 3: Call OpenAI API
    $ai_response = call_openai_api($query, $context);
    
    return new WP_REST_Response(array(
        'query' => $query,
        'answer' => $ai_response,
        'sources' => $context
    ), 200);
}

function call_openai_api($query, $context) {
    $api_key = get_option('openai_api_key'); // Store securely!
    
    $context_text = array_map(function($item) {
        return "Title: {$item['title']}\nContent: {$item['excerpt']}";
    }, $context);
    
    $messages = array(
        array(
            'role' => 'system',
            'content' => 'You are a helpful assistant for Dispatches Europe, a website helping expats navigate their journey to Europe. Answer questions based on the provided article context. Be concise and helpful.'
        ),
        array(
            'role' => 'user',
            'content' => "Based on these articles:\n\n" . implode("\n\n---\n\n", $context_text) . "\n\nAnswer this question: " . $query
        )
    );
    
    $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode(array(
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
            'max_tokens' => 500,
            'temperature' => 0.7
        )),
        'timeout' => 30
    ));
    
    if (is_wp_error($response)) {
        return 'Sorry, I encountered an error. Please try again.';
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return $body['choices'][0]['message']['content'] ?? 'No response generated.';
}
```

#### 2. Enhanced Search with Vector Embeddings (Advanced)

For better semantic search, use embeddings:

```php
// Store embeddings when posts are saved
add_action('save_post', 'dispatches_europe_generate_embedding', 10, 2);

function dispatches_europe_generate_embedding($post_id, $post) {
    if ($post->post_status !== 'publish') return;
    
    $content = $post->post_title . ' ' . wp_strip_all_tags($post->post_content);
    
    // Call OpenAI Embeddings API
    $embedding = get_openai_embedding($content);
    
    // Store in post meta (or use a vector database like Pinecone)
    update_post_meta($post_id, '_content_embedding', json_encode($embedding));
}

function get_openai_embedding($text) {
    $api_key = get_option('openai_api_key');
    
    $response = wp_remote_post('https://api.openai.com/v1/embeddings', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode(array(
            'model' => 'text-embedding-3-small',
            'input' => substr($text, 0, 8000) // Token limit
        ))
    ));
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return $body['data'][0]['embedding'] ?? null;
}
```

### Alternative AI Solutions

| Solution | Pros | Cons |
|----------|------|------|
| **OpenAI API** | Powerful, flexible | Cost per query, requires API management |
| **Anthropic Claude** | Great for long content | Similar cost structure |
| **Azure OpenAI** | Enterprise features | More complex setup |
| **Algolia AI** | Built for search | Monthly subscription |
| **Elasticsearch + ML** | Self-hosted option | Infrastructure overhead |

---

## 📊 Getting Trending Articles from WordPress

### Option 1: Popular Posts by Views (Recommended)

Use a plugin like **Post Views Counter** or implement custom tracking:

```php
// REST API endpoint for trending articles
add_action('rest_api_init', function() {
    register_rest_route('dispatches-europe/v1', '/trending', array(
        'methods' => 'GET',
        'callback' => 'dispatches_europe_get_trending',
        'permission_callback' => '__return_true'
    ));
});

function dispatches_europe_get_trending($request) {
    // Option A: Using Post Views Counter plugin
    $args = array(
        'post_type' => 'post',
        'posts_per_page' => 10,
        'meta_key' => 'post_views_count',
        'orderby' => 'meta_value_num',
        'order' => 'DESC',
        'date_query' => array(
            array(
                'after' => '7 days ago' // Trending = recent + popular
            )
        )
    );
    
    // Option B: Using custom view tracking
    // $args['meta_key'] = '_dispatches_europe_views';
    
    $posts = get_posts($args);
    
    $trending = array_map(function($post) {
        $categories = get_the_category($post->ID);
        $category = $categories[0] ?? null;
        
        return array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'url' => get_permalink($post->ID),
            'category' => $category ? $category->slug : 'general',
            'categoryName' => $category ? $category->name : 'General',
            'views' => get_post_meta($post->ID, 'post_views_count', true)
        );
    }, $posts);
    
    return new WP_REST_Response($trending, 200);
}
```

### Option 2: Custom View Tracking (No Plugin)

```php
// Track views on single post pages
add_action('wp_head', 'dispatches_europe_track_view');

function dispatches_europe_track_view() {
    if (!is_single()) return;
    if (is_user_logged_in() && current_user_can('edit_posts')) return; // Skip admins
    
    $post_id = get_the_ID();
    $views = (int) get_post_meta($post_id, '_dispatches_europe_views', true);
    update_post_meta($post_id, '_dispatches_europe_views', $views + 1);
    
    // Also track daily views for trending
    $today = date('Y-m-d');
    $daily_key = '_dispatches_europe_views_' . $today;
    $daily_views = (int) get_post_meta($post_id, $daily_key, true);
    update_post_meta($post_id, $daily_key, $daily_views + 1);
}

// Calculate trending score (weighted recent views)
function dispatches_europe_get_trending_score($post_id) {
    $score = 0;
    $weights = array(1 => 3, 2 => 2.5, 3 => 2, 4 => 1.5, 5 => 1, 6 => 0.5, 7 => 0.25);
    
    for ($i = 0; $i <= 7; $i++) {
        $date = date('Y-m-d', strtotime("-{$i} days"));
        $views = (int) get_post_meta($post_id, '_dispatches_europe_views_' . $date, true);
        $weight = $weights[$i] ?? 0.1;
        $score += $views * $weight;
    }
    
    return $score;
}
```

### Option 3: Using Analytics Data

```php
// If using Google Analytics, fetch popular pages via GA4 Data API
// Requires Google Analytics Data API setup
function dispatches_europe_get_trending_from_ga() {
    // Use Google Analytics Data API (GA4)
    // See: https://developers.google.com/analytics/devguides/reporting/data/v1
    
    // This requires OAuth setup and is more complex
    // Consider using a plugin like MonsterInsights for easier integration
}
```

---

## 🎨 Customization

### Colors

Edit CSS variables in `widget.css`:

```css
:root {
    --ep-primary: #1a73e8;      /* Main brand color */
    --ep-primary-hover: #1557b0;
    --ep-green: #34a853;         /* Accent color */
    /* ... more variables ... */
}
```

### Suggestion Chips

Edit the chips in HTML to match your site's topics:

```html
<button class="chip" data-query="Your topic here">Your topic here</button>
```

### Categories

Add new category colors in CSS:

```css
.category-yourcat {
    color: #your-color;
    background: #your-light-color;
}
```

---

## 📱 Responsive Design

The widget is fully responsive and works on:
- Desktop (max-width: 380px widget)
- Tablet (same as desktop)
- Mobile (full-width, adjusted sizing)

---

## 🔧 JavaScript API

The widget exposes a global API:

```javascript
// Programmatically trigger a search
DispatchesEuropeWidget.search('visa requirements');

// Refresh trending articles
DispatchesEuropeWidget.refresh();
```

---

## 📈 Analytics Integration

The widget automatically tracks events if Google Analytics is present:

- `search` - When user performs a search
- `trending_click` - When user clicks a trending article
- `chip_click` - When user clicks a suggestion chip

---

## 🛡️ Security Considerations

1. **API Keys**: Never expose OpenAI API keys in frontend code. Always call from server-side.
2. **Rate Limiting**: Implement rate limiting on your search API to prevent abuse.
3. **Input Sanitization**: Always sanitize user input before processing.
4. **CORS**: Configure proper CORS headers if widget is on different domain.

```php
// Rate limiting example
function dispatches_europe_check_rate_limit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient_key = 'ep_rate_' . md5($ip);
    $count = get_transient($transient_key) ?: 0;
    
    if ($count >= 20) { // 20 requests per minute
        return new WP_Error('rate_limited', 'Too many requests', array('status' => 429));
    }
    
    set_transient($transient_key, $count + 1, MINUTE_IN_SECONDS);
    return true;
}
```

---

## 📝 License

MIT License - Feel free to use and modify for your projects.


