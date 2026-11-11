#!/usr/bin/env python3
"""Add OUR STORY to the existing trusted 8443 gateway; preserve other routes/TLS.

Validate both candidates before --apply, keep bind-mounted file inodes, and restore
both configs on acceptance failure. Does not change certificates or tunnels.
"""
import argparse
import datetime
import hashlib
import http.client
import json
import os
from pathlib import Path
import shutil
import socket
import ssl
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--apply', action='store_true')
a = p.parse_args()
public_host = '114.55.234.248'
canonical = 'https://' + public_host + ':8443'
main = Path('/opt/maomao_makeup/Caddyfile')
gateway = Path('/opt/herdr-gateway/config/Caddyfile')
configs = [
    (gateway, 'herdr-gateway', '06790dbdf8dfab90ce05b9f86febb54951e7e3a40b2eac36c7c6445cc92db5ca'),
    (main, 'maomao_makeup-caddy-1', '1a26a2a0cd33c67496df3ffcdb59f295e904a7d56b501a15b7e78015788b9e6f'),
]
originals = {}
candidates = {}
for file, container, expected in configs:
    raw = file.read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise SystemExit('Configuration changed since inspection: ' + str(file))
    originals[file] = raw
    text = raw.decode()
    if file == gateway:
        anchor = '    @orca_root {'
        if text.count(anchor) != 1 or '@our_story' in text:
            raise SystemExit('Unexpected gateway structure')
        block = ('    # BEGIN OUR STORY HTTPS\n'
                 '    @our_story path /our-story /our-story/*\n'
                 '    handle @our_story {\n'
                 '        reverse_proxy 10.255.1.1:3010\n'
                 '    }\n'
                 '    # END OUR STORY HTTPS\n\n')
        text = text.replace(anchor, block + anchor)
    else:
        anchor = '  reverse_proxy @our_story 10.255.1.1:3010'
        if text.count(anchor) != 1:
            raise SystemExit('Unexpected HTTP site structure')
        text = text.replace(anchor, '  redir @our_story ' + canonical + '{uri} 308')
    candidates[file] = text.encode()
backup = Path('/opt/our-story/backups') / ('https-' + datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%S%fZ'))
backup.mkdir(parents=True, mode=0o700)
for file, container, unused in configs:
    shutil.copy2(str(file), str(backup / (container + '.before')))
    candidate = backup / (container + '.candidate')
    candidate.write_bytes(candidates[file])
    os.chmod(str(candidate), 0o600)
    subprocess.check_call(['docker', 'cp', str(candidate), container + ':/tmp/our-story-https.candidate'])
    subprocess.check_call(['docker', 'exec', container, 'caddy', 'validate', '--config', '/tmp/our-story-https.candidate', '--adapter', 'caddyfile'])

# Unverified local TLS is used only to fingerprint existing services (including
# the already-untrusted 443 endpoint); external acceptance must validate trust.
def request(port, route):
    if port == 80:
        c = http.client.HTTPConnection('127.0.0.1', port, timeout=10)
    else:
        c = http.client.HTTPSConnection('127.0.0.1', port, timeout=10, context=ssl._create_unverified_context())
    c.request('GET', route, headers={'Host': public_host + (':8443' if port == 8443 else '')})
    r = c.getresponse()
    body = r.read()
    result = {'status': r.status, 'sha256': hashlib.sha256(body).hexdigest(), 'location': r.getheader('Location'), 'type': r.getheader('Content-Type')}
    c.close()
    return result, body

def leaf(port):
    context = ssl._create_unverified_context()
    with socket.create_connection(('127.0.0.1', port), timeout=8) as raw:
        with context.wrap_socket(raw, server_hostname=public_host) as tls:
            return hashlib.sha256(tls.getpeercert(binary_form=True)).hexdigest()

routes = [(80, '/'), (80, '/xiaozhi/v1/'), (80, '/.well-known/acme-challenge/our-story-preflight'), (443, '/xiaozhi/v1/'), (8443, '/'), (8443, '/orca'), (8443, '/api/session')]
baselines = {}
for port, route in routes:
    before, unused = request(port, route)
    repeated, unused = request(port, route)
    baselines[(port, route)] = (before, before['sha256'] == repeated['sha256'])
certificates = {port: leaf(port) for port in [443, 8443]}
if not a.apply:
    print(json.dumps({'validated': True, 'applied': False, 'backup': str(backup), 'baselineStatuses': {str(port) + route: before['status'] for (port, route), (before, stable) in baselines.items()}}))
    raise SystemExit(0)
for file in originals:
    if file.read_bytes() != originals[file]:
        raise SystemExit('Concurrent edit: ' + str(file))

written = []
def write(file, raw):
    with file.open('wb') as stream:
        stream.write(raw)
        stream.flush()
        os.fsync(stream.fileno())

def reload(container):
    subprocess.check_call(['docker', 'exec', container, 'caddy', 'reload', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'])

try:
    # Make trusted HTTPS available before redirecting old HTTP links.
    for file, container, unused in configs:
        if file.read_bytes() != originals[file]:
            raise RuntimeError('Concurrent edit: ' + str(file))
        written.append((file, container))
        write(file, candidates[file])
        reload(container)
    info, body = request(8443, '/our-story/api/premiere')
    state = json.loads(body.decode())
    if info['status'] != 200 or state.get('status') != 'locked' or state.get('preview') is not False:
        raise RuntimeError('HTTPS premiere acceptance failed')
    redirect, unused = request(80, '/our-story?preview=1')
    if redirect['status'] != 308 or redirect['location'] != canonical + '/our-story?preview=1':
        raise RuntimeError('HTTP redirect acceptance failed')
    for (port, route), (before, stable) in baselines.items():
        after, unused = request(port, route)
        keys = ['status', 'location', 'type'] + (['sha256'] if stable else [])
        if any(after[k] != before[k] for k in keys):
            raise RuntimeError('Existing route changed: ' + str(port) + route)
    if any(leaf(port) != fingerprint for port, fingerprint in certificates.items()):
        raise RuntimeError('Existing TLS identity changed')
except Exception:
    for file, container in reversed(written):
        if file.read_bytes() == candidates[file]:
            write(file, originals[file])
            reload(container)
        else:
            print('Preserved concurrent edit; backup at ' + str(backup))
    raise
record = {'url': canonical + '/our-story', 'appliedAt': datetime.datetime.utcnow().isoformat() + 'Z', 'backup': str(backup), 'configs': {container: hashlib.sha256(candidates[file]).hexdigest() for file, container, unused in configs}, 'tlsLeafSha256Unchanged': {str(port): value for port, value in certificates.items()}, 'existingStatuses': {str(port) + route: before['status'] for (port, route), (before, stable) in baselines.items()}, 'premiere': state, 'httpRedirect': redirect['location'], 'note': 'Local checks preserve identity; strict public TLS/browser acceptance is a separate required check.'}
Path('/opt/our-story/https-deployment.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
