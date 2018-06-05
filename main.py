from os import mkdir

from bottle import route, get, request, static_file, run

from settings import PORT, DIR_CACHE, DIR_GRAPH
from crypkograph import render_graph


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


# /api/render?owner_addr={owner_addr}
@get('/api/render')
def render():
    owner_addr = request.query['owner_addr']
    if not owner_addr:
        raise Exception()
    render_graph(owner_addr, subdir=DIR_GRAPH)


if __name__ == '__main__':
    try:
        mkdir(DIR_CACHE)
    except FileExistsError:
        pass

    run(host='0.0.0.0', port=PORT)
