from itertools import chain
from hashlib import sha1
import shutil
from typing import Any, List, NamedTuple

import requests
from graphviz import Digraph

URL_SEARCH = 'https://api.crypko.ai/crypkos/search' \
    '?category=all&sort=-id&ownerAddr={owner_addr}'
# crypkos[].id
URL_DETAIL = 'https://api.crypko.ai/crypkos/{crypko_id}/detail'
# ownerAddr
# derivatives[].id
# TODO originsはどうやって求める？
URL_IMG = 'https://img.crypko.ai/daisy/{crypko_img_name}'
# crypko_img_id = sha1(noise + "asdasd3edwasd" + attr)
IMG_SIZE = 96


class Crypko(NamedTuple):
    id: int
    derivatives: List[int]
    iteration: int
    noise: str
    attrs: str
    img_id: str
    owner_addr: str
    owner_name: str


def get_crypko_ids_by_owner(owner_addr: str) -> List[int]:
    res = requests.get(URL_SEARCH.format(owner_addr=owner_addr)).json()
    return [c['id'] for c in res['crypkos']]


def get_crypko_by_id(crypko_id: int) -> Crypko:
    res = requests.get(URL_DETAIL.format(crypko_id=crypko_id)).json()
    derivatives = [c['id'] for c in res['derivatives']]
    noise = res['noise']
    attrs = res['attrs']
    img_id = get_crypko_img_id(noise, attrs)
    return Crypko(
        crypko_id,
        derivatives,
        res['iteration'],
        noise,
        attrs,
        img_id,
        res['owner']['address'],
        res['owner']['username']
    )


def get_crypko_img_id(noise: str, attrs: str) -> str:
    return sha1((noise + 'asdasd3edwasd' + attrs).encode()).hexdigest()


def get_crypko_img_name(c: Crypko) -> str:
    return f'{c.img_id}_sm.jpg'


def get_crypko_img_url(c: Crypko) -> str:
    return URL_IMG.format(crypko_img_name=get_crypko_img_name(c))


def download(url, filename) -> bool:
    r = requests.get(url, stream=True)
    if r.status_code != 200:
        return False
    with open(filename, 'wb') as f:
        r.raw.decode_content = True
        shutil.copyfileobj(r.raw, f)
    return True


def flatten(l: List[Any]):
    return list(chain.from_iterable(l))


def render_graph(owner_addr: str):
    crypkos_of_owner = [get_crypko_by_id(id)
                        for id in get_crypko_ids_by_owner(owner_addr)]
    crypko_id_set_of_owner = {c.id for c in crypkos_of_owner}
    crypko_id_set_of_others = {
        id
        for id in flatten([c.derivatives for c in crypkos_of_owner])
        if id not in crypko_id_set_of_owner
    }
    crypkos_of_others = [get_crypko_by_id(id)
                         for id in crypko_id_set_of_others]
    crypkos = crypkos_of_owner + crypkos_of_others

    dot = Digraph(comment=f'Crypkos of {owner_addr}')

    for c in crypkos:
        img_name = get_crypko_img_name(c)
        download(get_crypko_img_url(c), img_name)
        # NOTE node id must be str
        dot.node(str(c.id), f"""<
        <table>
            <tr>
                <td><img src="{img_name}"/></td>
            </tr>
            <tr>
                <td>{c.owner_name}'s iter {c.iteration}</td>
            </tr>
        </table>
            >""", shape='none')

    for c in crypkos_of_owner:
        for id in c.derivatives:
            dot.edge(str(c.id), str(id))

    dot.format = 'png'
    dot.render(f'{owner_addr}.gv')
    dot.format = 'pdf'
    dot.render(f'{owner_addr}.gv')
