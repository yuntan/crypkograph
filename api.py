from bottle import get, request

from crypkograph import render_graph


# /api/render?owner_addr={owner_addr}
@get('/api/render')
def render():
    owner_addr = request.query['owner_addr']
    if not owner_addr:
        raise Exception()
    render_graph(owner_addr)
