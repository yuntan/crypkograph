from bottle import route, get, request, static_file, run

from crypkograph import render_graph

SUBDIR_GRAPH = 'generated'


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
        return static_file(filename, SUBDIR_GRAPH, mimetype='image/png')
    elif ext == 'pdf':
        return static_file(filename, SUBDIR_GRAPH, download=filename)


# /api/render?owner_addr={owner_addr}
@get('/api/render')
def render():
    owner_addr = request.query['owner_addr']
    if not owner_addr:
        raise Exception()
    render_graph(owner_addr, subdir=SUBDIR_GRAPH)


if __name__ == '__main__':
    run(host='0.0.0.0', port=8080)
