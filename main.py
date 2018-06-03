from bottle import route, static_file, run

import api


@route('/')
def serve_html():
    return static_file('index.html', '.')


@route('/index.js')
def serve_js():
    return static_file('index.js', '.')


@route('/example.png')
def serve_img():
    return static_file('example.png', '.')


@route('/<filename:re:.*\.gv\.(png|pdf)>')
def serve_graph(filename):
    return static_file(filename, '.')

if __name__ == '__main__':
    run(host='0.0.0.0', port=8080)
