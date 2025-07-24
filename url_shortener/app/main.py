import logging
from flask import Flask, jsonify, request, redirect, url_for
from flask_cors import CORS
from .utils import generate_short_code, is_valid_url
from .models import add_url_mapping, get_url_mapping, increment_click, generate_analytics_token, validate_analytics_token
import time

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.errorhandler(Exception)
def handle_exception(e):
    logger.exception("Unhandled exception: %s", e)
    return jsonify({"error": "Internal server error"}), 500

@app.route('/')
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "URL Shortener API"
    })

@app.route('/api/health')
def api_health():
    return jsonify({
        "status": "ok",
        "message": "URL Shortener API is running"
    })

@app.route('/api/shorten', methods=['POST'])
def shorten_url():
    try:
        data = request.get_json(force=True, silent=True)
        if not data or 'url' not in data:
            logger.warning("Missing 'url' in request body: %s", data)
            return jsonify({"error": "Missing 'url' in request body"}), 400
        long_url = str(data['url']).strip()
        if not is_valid_url(long_url):
            logger.warning("Invalid URL format: %s", long_url)
            return jsonify({"error": "Invalid URL format"}), 400
        # Generate a unique short code
        for _ in range(5):
            short_code = generate_short_code()
            if not get_url_mapping(short_code):
                break
        else:
            logger.error("Could not generate unique short code for URL: %s", long_url)
            return jsonify({"error": "Could not generate unique short code"}), 500
        analytics_token = generate_analytics_token()
        add_url_mapping(short_code, long_url, analytics_token=analytics_token)
        short_url = request.host_url.rstrip('/') + '/' + short_code
        logger.info("Shortened URL: %s -> %s", long_url, short_url)
        return jsonify({"short_code": short_code, "short_url": short_url, "analytics_token": analytics_token}), 201
    except Exception as e:
        logger.exception("Error in shorten_url endpoint")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/<short_code>', methods=['GET'])
def redirect_short_url(short_code):
    try:
        code = str(short_code).strip()
        if not code.isalnum() or len(code) != 6:
            logger.warning("Invalid short code format: %s", code)
            return jsonify({"error": "Invalid short code format"}), 400
        mapping = get_url_mapping(code)
        if not mapping:
            logger.info("Short code not found: %s", code)
            return jsonify({"error": "Short code not found"}), 404
        increment_click(code)
        logger.info("Redirecting short code %s to %s", code, mapping['url'])
        return redirect(mapping['url'])
    except Exception as e:
        logger.exception("Error in redirect_short_url endpoint")
        return jsonify({"error": "Internal server error"}), 500

# Analytics endpoint now requires analytics_token as a query param or header
@app.route('/api/stats/<short_code>', methods=['GET'])
def stats(short_code):
    try:
        code = str(short_code).strip()
        if not code.isalnum() or len(code) != 6:
            logger.warning("Invalid short code format for stats: %s", code)
            return jsonify({"error": "Invalid short code format"}), 400
        token = request.args.get('token') or request.headers.get('X-Analytics-Token')
        if not token:
            logger.warning("Missing analytics token for stats: %s", code)
            return jsonify({"error": "Missing analytics token"}), 401
        if not validate_analytics_token(code, token):
            logger.warning("Invalid analytics token for stats: %s", code)
            return jsonify({"error": "Invalid analytics token"}), 403
        mapping = get_url_mapping(code)
        if not mapping:
            logger.info("Short code not found for stats: %s", code)
            return jsonify({"error": "Short code not found"}), 404
        logger.info("Stats requested for short code %s", code)
        return jsonify({
            "url": mapping['url'],
            "clicks": mapping['clicks'],
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(mapping['created_at']))
        })
    except Exception as e:
        logger.exception("Error in stats endpoint")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)