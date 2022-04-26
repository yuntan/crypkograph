import os
import regex

from bottle import route, get, request, static_file, run

from google import storage

from crypkograph import render_graph


PORT = int(os.environ['PORT'])
GCS_BUCKET = os.environ['GCS_BUCKET']


@route('/')
@route('/index.html')
def serve_html():
    return static_file('index.html', '.')


@route('/static/<filename:path>')
def serve_static(filename):
    return static_file(filename, 'static')


@route('/generated/<filename:re:.*\.gv\.(png|pdf)>')
def serve_generated(filename):
    ext = filename.split('.')[-1]
    if ext == 'png':
        return static_file(filename, DIR_GRAPH, mimetype='image/png')
    elif ext == 'pdf':
        return static_file(filename, DIR_GRAPH, download=filename)


# /api/render?user_id={user_id}
@get('/api/render')
def render():
    user_id: str = request.query['user_id']
    if not user_id or not regex.match(r'^\d{19}$', user_id):
        raise Exception()  # TODO: return invalid request
    crypko_graph = render_graph(user_id)


if __name__ == '__main__':
    run(host='0.0.0.0', port=PORT)
