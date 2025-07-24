import threading
import time
import copy
import secrets

# In-memory storage for short codes
# All access is protected by a threading.Lock for thread safety.
data_store = {}
lock = threading.Lock()

# Data structure example:
# data_store = {
#   'abc123': {
#       'url': 'https://example.com',
#       'clicks': 0,
#       'created_at': 1700000000.0,
#       'analytics_token': 'randomtoken123'
#   },
#   ...
# }

def generate_analytics_token():
    return secrets.token_urlsafe(16)

def add_url_mapping(short_code, url, analytics_token=None):
    """Thread-safe: Add a new short code mapping."""
    with lock:
        data_store[short_code] = {
            'url': url,
            'clicks': 0,
            'created_at': time.time(),
            'analytics_token': analytics_token or generate_analytics_token()
        }

def get_url_mapping(short_code):
    """Thread-safe: Get a copy of the mapping for a short code, or None if not found."""
    with lock:
        mapping = data_store.get(short_code)
        return copy.deepcopy(mapping) if mapping else None

def increment_click(short_code):
    """Thread-safe: Increment click count for a short code. Returns True if successful."""
    with lock:
        if short_code in data_store:
            data_store[short_code]['clicks'] += 1
            return True
        return False

def short_code_exists(short_code):
    """Thread-safe: Check if a short code exists in the data store."""
    with lock:
        return short_code in data_store

def validate_analytics_token(short_code, token):
    """Thread-safe: Validate the analytics token for a short code."""
    with lock:
        mapping = data_store.get(short_code)
        if mapping and mapping.get('analytics_token') == token:
            return True
        return False