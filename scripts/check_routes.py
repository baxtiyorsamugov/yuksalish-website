"""Read-only HTTP checks against the new local preview. No requests to external sites."""
import json
import os
from pathlib import Path
from urllib.request import urlopen, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError

BASE = os.environ.get('BASE_URL','http://127.0.0.1:8090').rstrip('/')
ROOT = Path(__file__).resolve().parents[1]
registry = json.loads((ROOT/'docs/legacy-routes.json').read_text(encoding='utf-8'))
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args): return None
opener = build_opener(NoRedirect)
checked = 0
def request(path):
    try: response = opener.open(BASE+path,timeout=15)
    except HTTPError as error: response=error
    return response.status, response.headers, response.read().decode('utf-8')
for language in ['uz','uzc','ru','en']:
    for old,new in registry['aliases'].items():
        status,headers,_=request('/'+language+'/'+old)
        assert status==301 and headers['Location']=='/'+language+'/'+new,(language,old,status)
        checked+=1
    for route in registry['preserved']+['','regions','region/tashkent','join','library','contacts']:
        status,_,body=request('/'+language+'/'+route)
        assert status==200,(language,route,status)
        assert 'Fatal error' not in body and 'Warning:' not in body,(language,route)
        checked+=1
    status,_,body=request('/?lang='+language)
    assert status==200 and '<h1' in body
for route in ['/uz/news_detail/999999','/en/unknown','/uz/region/unknown','/uz/news/extra/path','/assets/../src/data/content.json']:
    status,_,_=request(route)
    assert status==404,(route,status)
    checked+=1
for query in ['?q=%3Cscript%3Ealert(1)%3C/script%3E','?q[]=test','?category[]=test','?p[]=1']:
    status,_,body=request('/en/news'+query)
    assert status==200 and '<script>alert(1)</script>' not in body,(query,status)
status,_,body=request('/ru/news?q='+'%D0%B0'*201)
assert status==200 and 'Warning:' not in body
status,_,body=request('/?lang[]=ru')
assert status==200
print(f'{checked} route checks plus malformed queries and escaped search passed.')
