from waitress import serve
import app
serve(app.app, host='0.0.0.0', port=4000, url_scheme='https')