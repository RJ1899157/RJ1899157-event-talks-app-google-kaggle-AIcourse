from flask import Flask, render_template, jsonify, request
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import time
from datetime import datetime
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, 
            template_folder=os.path.join(base_dir, 'templates'),
            static_folder=os.path.join(base_dir, 'static'))

# In-memory cache for feed data
FEED_CACHE = {
    'data': None,
    'last_updated': 0
}
CACHE_TTL = 300  # 5 minutes in seconds

def fetch_and_parse_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    updates = []
    
    for entry in entries:
        date_str = entry.find('atom:title', ns).text.strip()
        updated_str = entry.find('atom:updated', ns).text.strip()
        entry_id = entry.find('atom:id', ns).text.strip()
        content_element = entry.find('atom:content', ns)
        
        if content_element is None or not content_element.text:
            continue
            
        html_content = content_element.text
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Split by h3 (standard GCP feed headings)
        headers_tags = soup.find_all('h3')
        
        if not headers_tags:
            # Entire content as one update
            updates.append({
                'id': entry_id,
                'date': date_str,
                'type': 'Update',
                'html': str(soup),
                'text': soup.get_text().strip(),
            })
            continue
            
        for i, header in enumerate(headers_tags):
            update_type = header.get_text().strip()
            # Collect siblings until next h3
            sibling_html = []
            sibling_text = []
            sibling = header.next_sibling
            while sibling and sibling.name != 'h3':
                if sibling.name:
                    sibling_html.append(str(sibling))
                    sibling_text.append(sibling.get_text())
                sibling = sibling.next_sibling
            
            html_snippet = "".join(sibling_html)
            text_snippet = " ".join(sibling_text).strip()
            # Clean up extra spacing/whitespace
            text_snippet = ' '.join(text_snippet.split())
            
            # Generate a sub-id for uniqueness
            sub_id = f"{entry_id}#{i}"
            
            updates.append({
                'id': sub_id,
                'date': date_str,
                'type': update_type,
                'html': html_snippet,
                'text': text_snippet
            })
            
    return updates

def get_updates(force_refresh=False):
    now = time.time()
    if not force_refresh and FEED_CACHE['data'] and (now - FEED_CACHE['last_updated'] < CACHE_TTL):
        return FEED_CACHE['data'], FEED_CACHE['last_updated']
        
    data = fetch_and_parse_feed()
    FEED_CACHE['data'] = data
    FEED_CACHE['last_updated'] = now
    return data, now

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        data, last_updated = get_updates(force_refresh=force_refresh)
        
        # Format last_updated timestamp to readable local time
        dt = datetime.fromtimestamp(last_updated)
        formatted_time = dt.strftime('%Y-%m-%d %I:%M:%S %p')
        
        return jsonify({
            'success': True,
            'updates': data,
            'last_updated': formatted_time
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
