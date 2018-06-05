from itertools import chain
from hashlib import sha1
import shutil
from typing import Any, List, NamedTuple, Iterable

import requests
from graphviz import Digraph

URL_SEARCH = 'https://api.crypko.ai/crypkos/search'
URL_DETAIL = 'https://api.crypko.ai/crypkos/{crypko_id}/detail'
URL_IMG = 'https://img.crypko.ai/daisy/{crypko_img_name}'
URL_CARD = 'https://crypko.ai/#/card/{crypko_id}'


class Crypko(NamedTuple):
    id: int
    name: str
    matron: int
    sire: int
    derivatives: List[int]
    iteration: int
    noise: str
    attrs: str
    img_id: str
    owner_addr: str
    owner_name: str
    card_url: str


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
    matron = res['matron']['id']
    sire = res['sire']['id']
    # derivatives[].id
    derivatives = [c['id'] for c in res['derivatives']]
    # TODO originsはどうやって求める？
    noise = res['noise']
    attrs = res['attrs']
    img_id = get_crypko_img_id(noise, attrs)
    card_url = URL_CARD.format(crypko_id=crypko_id)
    return Crypko(
        crypko_id,
        res.get('name'),  # name is optional
        matron,
        sire,
        derivatives,
        res['iteration'],
        noise,
        attrs,
        img_id,
        res['owner']['address'],
        res['owner']['username'],
        card_url
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


def flatten(l: Iterable[Iterable[Any]]) -> Iterable[Any]:
    return chain.from_iterable(l)


def render_graph(owner_addr: str, subdir=None):
    crypkos_of_owner = [get_crypko_by_id(id)
                        for id in get_crypko_ids_by_owner(owner_addr)]
    crypko_id_set_of_owner = {c.id for c in crypkos_of_owner}
    crypko_id_set_of_others = {
        id
        for id in flatten([[c.matron, c.sire] + c.derivatives
                           for c in crypkos_of_owner])
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
        node_id = str(c.id)
        color = '#D36061' if c.owner_addr == owner_addr else 'black'
        # NOTE hrefはPDFでは無効
        dot.node(node_id, f"""<
        <table border="1" cellborder="0" cellspacing="0">
            <tr>
                <td><img src="{img_name}"/></td>
            </tr>
            <tr>
                <td>
                    {c.name if c.name else '#' + str(c.id)}<br/>
                    Iter <b>{c.iteration}</b> / {c.owner_name}
                </td>
            </tr>
        </table>
            >""", shape='none', color=color, href=c.card_url)

    # 自分の所有するカードからその派生への全ての辺
    for c in crypkos_of_owner:
        for id in c.derivatives:
            dot.edge(str(c.id), str(id))
    # 自分の所有しないカードから派生している自分の所有するカードへの辺
    for c in crypkos_of_others:
        for id in c.derivatives:
            if id in crypkos_of_owner:
                dot.edge(str(c.id), str(id))

    filename = f'{owner_addr}.gv'
    dot.format = 'png'
    dot.render(filename, subdir)
    dot.format = 'pdf'
    dot.render(filename, subdir)
