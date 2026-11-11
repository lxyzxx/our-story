#!/usr/bin/env python3
"""Install a verified standalone release on the designated Linux server.

Run over SSH as root, after checking the service template and chosen bind address.
This script does not change reverse-proxy routing or existing shared content.
Compatible with the server's Python 3.6.
"""
import argparse
import grp
import hashlib
import http.client
import ipaddress
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import subprocess
import tarfile
import time

parser = argparse.ArgumentParser()
parser.add_argument('artifact')
parser.add_argument('sha256')
parser.add_argument('--bind', required=True)
parser.add_argument('--unit', default='/tmp/our-story.service')
args = parser.parse_args()
if os.geteuid() != 0:
    raise SystemExit('Run as root')
ipaddress.ip_address(args.bind)
artifact = Path(args.artifact)
if hashlib.sha256(artifact.read_bytes()).hexdigest() != args.sha256:
    raise SystemExit('Artifact checksum mismatch')
root = Path('/opt/our-story')
with tarfile.open(str(artifact), 'r:gz') as archive:
    manifest = json.load(archive.extractfile('./release.json'))
    release_id = manifest['releaseId']
    if not re.fullmatch(r'our-story-[A-Za-z0-9-]+', release_id):
        raise SystemExit('Invalid release ID')
    if manifest['basePath'] != '/our-story' or manifest['platform'] != 'linux-x64':
        raise SystemExit('Unexpected deployment target')
    release = root / 'releases' / release_id
    if release.exists():
        raise SystemExit('Release already exists; do not overwrite an immutable release')
    for member in archive.getmembers():
        dest = (release / member.name).resolve()
        if os.path.commonpath([str(release), str(dest)]) != str(release):
            raise SystemExit('Unsafe archive member')
        if member.isdev() or member.isfifo() or member.islnk():
            raise SystemExit('Unsupported archive member')
        if member.issym():
            target = (dest.parent / member.linkname).resolve()
            if os.path.commonpath([str(release), str(target)]) != str(release):
                raise SystemExit('Unsafe archive symlink')
    release.mkdir(parents=True, mode=0o755)
    archive.extractall(str(release))
# Releases are root-owned, read-only to the application user.
for directory, folders, files in os.walk(str(release)):
    for entry in [directory] + [os.path.join(directory, f) for f in folders + files]:
        os.lchown(entry, 0, 0)
        if not os.path.islink(entry):
            mode = os.stat(entry).st_mode
            os.chmod(entry, 0o755 if os.path.isdir(entry) or mode & 0o111 else 0o644)
try:
    account = pwd.getpwnam('our-story')
except KeyError:
    subprocess.check_call(['useradd', '--system', '--user-group', '--home-dir', '/nonexistent', '--shell', '/sbin/nologin', 'our-story'])
    account = pwd.getpwnam('our-story')
shared = root / 'shared'
shared.mkdir(mode=0o750, exist_ok=True)
os.chown(str(shared), 0, account.pw_gid)
cache = shared / 'cache'
cache.mkdir(mode=0o750, exist_ok=True)
os.chown(str(cache), account.pw_uid, account.pw_gid)
content = shared / 'archive.json'
if not content.exists():
    shutil.copyfile(str(release / 'seed/archive.json'), str(content))
    os.chown(str(content), 0, account.pw_gid)
    os.chmod(str(content), 0o640)
cache_link = release / '.next/cache'
if cache_link.is_symlink() or cache_link.is_file():
    cache_link.unlink()
elif cache_link.exists():
    shutil.rmtree(str(cache_link))
cache_link.symlink_to(cache, target_is_directory=True)
config = Path('/etc/our-story')
config.mkdir(mode=0o750, exist_ok=True)
env = config / 'our-story.env'
if not env.exists():
    env.write_text('NODE_ENV=production\nHOSTNAME={}\nPORT=3010\nARCHIVE_CONTENT_FILE={}\nNEXT_TELEMETRY_DISABLED=1\nNODE_OPTIONS=--max-old-space-size=256\nMALLOC_ARENA_MAX=2\n'.format(args.bind, content))
    os.chmod(str(env), 0o600)
backups = root / 'backups' / release_id
backups.mkdir(parents=True, mode=0o700)
unit = Path('/etc/systemd/system/our-story.service')
if unit.exists():
    shutil.copy2(str(unit), str(backups / 'our-story.service'))
shutil.copyfile(args.unit, str(unit))
os.chmod(str(unit), 0o644)
current = root / 'current'
previous = current.resolve() if current.exists() else None
next_link = root / 'current.next'
if next_link.is_symlink():
    next_link.unlink()
next_link.symlink_to(release, target_is_directory=True)
os.replace(str(next_link), str(current))
subprocess.check_call(['systemd-analyze', 'verify', str(unit)])
subprocess.check_call(['systemctl', 'daemon-reload'])
subprocess.check_call(['systemctl', 'enable', 'our-story.service'])
try:
    subprocess.check_call(['systemctl', 'restart', 'our-story.service'])
    state = None
    for attempt in range(30):
        try:
            connection = http.client.HTTPConnection(args.bind, 3010, timeout=3)
            connection.request('GET', '/our-story/api/premiere')
            response = connection.getresponse()
            state = json.loads(response.read().decode())
            connection.close()
            if response.status == 200 and state.get('preview') is False:
                break
        except (OSError, ValueError):
            pass
        time.sleep(0.5)
    else:
        raise RuntimeError('Application did not pass readiness')
    subprocess.check_call(['systemctl', 'is-active', '--quiet', 'our-story.service'])
except Exception:
    subprocess.call(['systemctl', 'stop', 'our-story.service'])
    if previous:
        next_link.symlink_to(previous, target_is_directory=True)
        os.replace(str(next_link), str(current))
        if (backups / 'our-story.service').exists():
            shutil.copyfile(str(backups / 'our-story.service'), str(unit))
        subprocess.call(['systemctl', 'daemon-reload'])
        subprocess.call(['systemctl', 'start', 'our-story.service'])
    raise
if previous:
    old = root / 'previous'
    if old.is_symlink():
        old.unlink()
    old.symlink_to(previous, target_is_directory=True)
record = {'releaseId': release_id, 'artifactSha256': args.sha256, 'sourceSha256': manifest['sourceSha256'], 'basePath': manifest['basePath'], 'previousRelease': str(previous) if previous else None, 'premiere': state}
(root / 'deployment.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
