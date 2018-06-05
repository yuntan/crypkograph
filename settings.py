from os import getenv

from dotenv import load_dotenv

# https://github.com/theskumar/python-dotenv/issues/108
# load_dotenv()
load_dotenv('.env', verbose=True)
PORT = getenv('PORT') or 8080
DIR_CACHE = getenv('DIR_CACHE') or 'cache'
DIR_GRAPH = getenv('DIR_GRAPH') or 'generated'
