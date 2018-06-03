from itertools import chain
from hashlib import sha1
import shutil
from typing import Any, List, NamedTuple

import requests
from graphviz import Digraph

URL_SEARCH = 'https://api.crypko.ai/crypkos/search'
URL_DETAIL = 'https://api.crypko.ai/crypkos/{crypko_id}/detail'
URL_IMG = 'https://img.crypko.ai/daisy/{crypko_img_name}'


class Crypko(NamedTuple):
    id: int
    derivatives: List[int]
    iteration: int
    noise: str
    attrs: str
    img_id: str
    owner_addr: str
    owner_name: str


def get_crypko_ids_by_owner(owner_addr: str, page_limit: int=3) -> List[int]:
    params = dict(category='all', sort='-id', ownerAddr=owner_addr)
    r = requests.get(URL_SEARCH, params)
    r.raise_for_status()
    res = r.json()
    # crypkos[].id
    crypko_ids = [c['id'] for c in res['crypkos']]
    if len(crypko_ids) == 0:  # avoid ZeroDivisionError
        return []

    max_page = res['totalMatched'] // len(crypko_ids)
    if page_limit:
        max_page = min(max_page, page_limit)
    for i in range(1, max_page + 1):
        params['page'] = str(i)
        r = requests.get(URL_SEARCH, params)
        r.raise_for_status()
        res = r.json()
        crypko_ids = crypko_ids + [c['id'] for c in res['crypkos']]

    return crypko_ids


def get_crypko_by_id(crypko_id: int) -> Crypko:
    r = requests.get(URL_DETAIL.format(crypko_id=crypko_id))
    r.raise_for_status()
    res = r.json()
    # derivatives[].id
    derivatives = [c['id'] for c in res['derivatives']]
    # TODO originsはどうやって求める？
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
    # crypko_img_id = sha1(noise + "asdasd3edwasd" + attr)
    return sha1((noise + 'asdasd3edwasd' + attrs).encode()).hexdigest()


def get_crypko_img_name(c: Crypko) -> str:
    return f'{c.img_id}_sm.jpg'


def get_crypko_img_url(c: Crypko) -> str:
    return URL_IMG.format(crypko_img_name=get_crypko_img_name(c))


def download(url, filename):
    r = requests.get(url, stream=True)
    r.raise_for_status()
    with open(filename, 'wb') as f:
        r.raw.decode_content = True
        shutil.copyfileobj(r.raw, f)
    return


def flatten(l: List[List[Any]]) -> List[Any]:
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
