#!/usr/bin/env python3
"""
Southern Frequencies — Spotify Playlist Builder
Pure stdlib, no third-party packages required.

SETUP (one-time, ~2 min):
  1. Go to https://developer.spotify.com/dashboard
  2. Click "Create app"
  3. Set Redirect URI to:  http://127.0.0.1:9090/callback
  4. Copy your Client ID and Client Secret

RUN:
  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy python3 create_spotify_playlist.py
"""

import base64
import json
import os
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Credentials (set via env vars) ──────────────────────────────────────────
CLIENT_ID     = os.environ.get('SPOTIFY_CLIENT_ID', '')
CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET', '')
REDIRECT_URI  = 'http://127.0.0.1:9090/callback'
SCOPE         = 'playlist-modify-public playlist-modify-private'

# ── Playlist definition ──────────────────────────────────────────────────────
PLAYLIST_NAME = 'Southern Frequencies'
PLAYLIST_DESC = 'A Dell Harris selection. Jazz-inflected · Southern underground · Mellow grime · SP-404 beat culture.'

TRACKS = [
    ('Dell Harris',       'Jazz Side'),
    ('MF DOOM',           'Accordion'),
    ('Loyle Carner',      'Ice Water'),
    ('Karriem Riggins',   'Alone Together'),
    ('OutKast',           'SpottieOttieDopaliscious'),
    ('Bexblu',            'Slew Dem'),
    ('Freddie Gibbs',     'Thuggin'),
    ('Knxwledge',         'Timez'),
    ('Little Simz',       '101 FM'),
    ('Rejie Snow',        'Cookie Chip'),
    ('Earl Sweatshirt',   'Grief'),
    ('Kano',              'T-Shirt Weather in the Manor'),
    ("Curren$y",          'Seat Change'),
    ('BADBADNOTGOOD',     'Time Moves Slow'),
    ('Smino',             'Wild Irish Roses'),
    ('Dell Harris',       'Jazz Charge'),
]

# ── OAuth callback server ────────────────────────────────────────────────────
_auth_code = None

class _CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global _auth_code
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if 'code' in qs:
            _auth_code = qs['code'][0]
            body = (
                b'<html><body style="background:#070503;color:#d4c4a8;'
                b'font-family:Helvetica Neue,Helvetica,sans-serif;'
                b'text-align:center;padding:120px 40px">'
                b'<p style="font-size:11px;letter-spacing:.5em;font-weight:300;'
                b'text-transform:uppercase;opacity:.7">Authorized &mdash; you can close this window.</p>'
                b'</body></html>'
            )
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(400)
            self.end_headers()

    def log_message(self, *_):
        pass


# ── Spotify API helpers ──────────────────────────────────────────────────────
def _get_token(code):
    creds = base64.b64encode(f'{CLIENT_ID}:{CLIENT_SECRET}'.encode()).decode()
    data  = urllib.parse.urlencode({
        'grant_type':   'authorization_code',
        'code':         code,
        'redirect_uri': REDIRECT_URI,
    }).encode()
    req = urllib.request.Request('https://accounts.spotify.com/api/token', data=data, method='POST')
    req.add_header('Authorization',  f'Basic {creds}')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['access_token']


def _api(method, url, token, payload=None):
    body = json.dumps(payload).encode() if payload else None
    req  = urllib.request.Request(url, data=body, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type',  'application/json')
    with urllib.request.urlopen(req) as r:
        raw = r.read()
        return json.loads(raw) if raw else {}


def _search(token, artist, track):
    q   = urllib.parse.urlencode({'q': f'artist:{artist} track:{track}', 'type': 'track', 'limit': 1})
    res = _api('GET', f'https://api.spotify.com/v1/search?{q}', token)
    items = res.get('tracks', {}).get('items', [])
    return items[0]['uri'] if items else None


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    global _auth_code

    if not CLIENT_ID or not CLIENT_SECRET:
        print('\n  Missing credentials.\n')
        print('  Run as:')
        print('    SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy python3 create_spotify_playlist.py\n')
        print('  Get credentials at: https://developer.spotify.com/dashboard')
        print('  Redirect URI to add: http://127.0.0.1:9090/callback\n')
        sys.exit(1)

    # 1. Start local callback server
    server = HTTPServer(('127.0.0.1', 9090), _CallbackHandler)
    t = threading.Thread(target=server.handle_request)
    t.daemon = True
    t.start()

    # 2. Open browser to Spotify auth
    params = urllib.parse.urlencode({
        'client_id':     CLIENT_ID,
        'response_type': 'code',
        'redirect_uri':  REDIRECT_URI,
        'scope':         SCOPE,
    })
    print('\n  Opening Spotify in your browser...')
    webbrowser.open(f'https://accounts.spotify.com/authorize?{params}')

    # 3. Wait for callback (2 min timeout)
    t.join(timeout=120)
    server.server_close()

    if not _auth_code:
        print('  Auth timed out. Try again.')
        sys.exit(1)

    # 4. Exchange code for access token
    token = _get_token(_auth_code)
    print('  ✓  Authorized')

    # 5. Get Spotify user ID
    me      = _api('GET', 'https://api.spotify.com/v1/me', token)
    user_id = me['id']

    # 6. Create playlist
    pl = _api('POST', f'https://api.spotify.com/v1/users/{user_id}/playlists', token, {
        'name':        PLAYLIST_NAME,
        'description': PLAYLIST_DESC,
        'public':      True,
    })
    pl_id  = pl['id']
    pl_url = pl['external_urls']['spotify']
    print(f'  ✓  Created playlist: {PLAYLIST_NAME}')
    print()

    # 7. Search and collect URIs
    uris      = []
    not_found = []

    for artist, track in TRACKS:
        uri = _search(token, artist, track)
        if uri:
            uris.append(uri)
            print(f'  ✓  {artist} — {track}')
        else:
            not_found.append(f'{artist} — {track}')
            print(f'  ✗  {artist} — {track}  (not on Spotify)')

    # 8. Add tracks in one call
    if uris:
        _api('POST', f'https://api.spotify.com/v1/playlists/{pl_id}/tracks', token, {'uris': uris})

    print()
    print('  ' + '─' * 48)
    print(f'  Added {len(uris)} / {len(TRACKS)} tracks.')
    if not_found:
        print(f'  Not found: {", ".join(not_found)}')
    print()
    print(f'  Playlist URL:')
    print(f'  {pl_url}')
    print('  ' + '─' * 48)
    print()


if __name__ == '__main__':
    main()
