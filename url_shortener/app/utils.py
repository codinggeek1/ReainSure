import random
import string
import re

# Generate a random 6-character alphanumeric short code
def generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

# Basic URL validation using regex
def is_valid_url(url):
    # Simple regex for http(s) URLs
    regex = re.compile(
        r'^(https?://)'  # http:// or https://
        r'([\w.-]+)'    # domain
        r'([:/?#][^\s]*)?$',  # optional path/query
        re.IGNORECASE
    )
    return re.match(regex, url) is not None