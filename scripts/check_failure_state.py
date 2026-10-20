"""Render a missing-content failure in an isolated temporary app, leaving the real app untouched."""
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

root = Path(__file__).resolve().parents[1]
local_php = root/'.tools/php84/php.exe'
php = os.environ.get('PHP_BINARY') or (str(local_php) if local_php.is_file() else shutil.which('php'))
if not php: raise SystemExit('PHP 8.4+ is required')
with tempfile.TemporaryDirectory(prefix='yuksalish-failure-') as temporary:
    staging = Path(temporary)
    shutil.copytree(root/'app/src',staging/'app/src',ignore=shutil.ignore_patterns('data'))
    (staging/'app/public').mkdir()
    shutil.copy2(root/'app/public/index.php',staging/'app/public/index.php')
    (staging/'scripts').mkdir()
    shutil.copy2(root/'scripts/preview-router.php',staging/'scripts/preview-router.php')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0))
        port = sock.getsockname()[1]
    process = subprocess.Popen([php,'-S',f'127.0.0.1:{port}','-t',str(staging/'app/public'),str(staging/'scripts/preview-router.php')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for attempt in range(40):
            try:
                urlopen(f'http://127.0.0.1:{port}/ru/news',timeout=2)
                raise AssertionError('Missing content must not return a success page')
            except HTTPError as error:
                body=error.read().decode('utf-8')
                assert error.code==503,error.code
                assert 'Не удалось загрузить материалы' in body
                assert 'Fatal error' not in body and 'Stack trace' not in body
                assert 'Повторить' in body and '/ru/news' in body
                break
            except URLError:
                time.sleep(.1)
        else: raise AssertionError('Isolated server did not start')
    finally:
        process.terminate()
        process.wait(timeout=5)
print('Missing-content scenario returns a localized 503 with retry, without exposing errors.')
