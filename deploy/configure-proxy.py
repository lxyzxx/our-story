#!/usr/bin/env python3
"""Validate or apply the dedicated subpath route without replacing the existing site."""
import argparse
import datetime
import hashlib
import http.client
import ipaddress
import json
import os
from pathlib import Path
import shutil
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--config', required=True)
p.add_argument('--container', required=True)
p.add_argument('--upstream', required=True)
p.add_argument('--public-host', required=True)
p.add_argument('--expected-sha256', required=True)
p.add_argument('--baseline', required=True)
p.add_argument('--apply', action='store_true')
a = p.parse_args()
ipaddress.ip_address(a.public_host)
host, port = a.upstream.rsplit(':', 1)
ipaddress.ip_address(host)
if not port.isdigit() or not 1 <= int(port) <= 65535:
    raise SystemExit('Invalid upstream port')
config = Path(a.config)
original = config.read_bytes()
if hashlib.sha256(original).hexdigest() != a.expected_sha256:
    raise SystemExit('Existing proxy changed since inspection; refusing to overwrite')
text = original.decode()
anchor = '  reverse_proxy app:8787'
if text.count(anchor) != 1 or '# BEGIN OUR STORY' in text:
    raise SystemExit('Unexpected existing site structure; inspect manually')
block = ('  # BEGIN OUR STORY - dedicated Next.js subpath\n'
         '  @our_story path /our-story /our-story/*\n'
         '  reverse_proxy @our_story ' + a.upstream + '\n'
         '  # END OUR STORY\n')
candidate = text.replace(anchor, block + anchor).encode()
name = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%S%fZ')
backup = Path('/opt/our-story/backups') / ('proxy-' + name)
backup.mkdir(parents=True, mode=0o700)
shutil.copy2(str(config), str(backup / 'Caddyfile.before'))
file = backup / 'Caddyfile.candidate'
file.write_bytes(candidate)
os.chmod(str(file), 0o600)
subprocess.check_call(['docker', 'cp', str(file), a.container + ':/tmp/our-story-Caddyfile.candidate'])
subprocess.check_call(['docker', 'exec', a.container, 'caddy', 'validate', '--config', '/tmp/our-story-Caddyfile.candidate', '--adapter', 'caddyfile'])
if not a.apply:
    print(json.dumps({'validated': True, 'applied': False, 'backup': str(backup)}))
    raise SystemExit(0)
baseline = json.loads(Path(a.baseline).read_text())
def request(path):
    connection = http.client.HTTPConnection('127.0.0.1', 80, timeout=10)
    connection.request('GET', path, headers={'Host': a.public_host})
    response = connection.getresponse()
    body = response.read()
    info = {'status': response.status, 'sha256': hashlib.sha256(body).hexdigest(), 'bytes': len(body), 'location': response.getheader('Location')}
    connection.close()
    return info, body

def write_in_place(content):
    # This file is bind-mounted individually into Caddy. Preserve its inode.
    with config.open('wb') as stream:
        stream.write(content)
        stream.flush()
        os.fsync(stream.fileno())

def reload_proxy():
    subprocess.check_call(['docker', 'exec', a.container, 'caddy', 'reload', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'])

# Detect concurrent edits before entering the mutation/rollback section.
if config.read_bytes() != original:
    raise SystemExit('Concurrent Caddy edit; refusing to overwrite')
try:
    write_in_place(candidate)
    reload_proxy()
    info, body = request('/our-story/api/premiere')
    state = json.loads(body.decode())
    if info['status'] != 200 or state.get('preview') is not False or state.get('status') != 'locked':
        raise RuntimeError('Public premiere state failed acceptance')
    for route, before in baseline.items():
        after, unused = request(route)
        if after != before:
            raise RuntimeError('Existing route changed: ' + route)
except Exception:
    if config.read_bytes() == candidate:
        write_in_place(original)
        reload_proxy()
    else:
        print('Concurrent proxy edit detected; preserved it. Original backup: ' + str(backup))
    raise
record = {'applied': True, 'configSha256': hashlib.sha256(candidate).hexdigest(), 'backup': str(backup), 'publicPremiere': state, 'existingRoutesUnchanged': list(baseline)}
Path('/opt/our-story/proxy-deployment.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
