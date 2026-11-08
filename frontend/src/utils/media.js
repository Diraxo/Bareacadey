/* Protected media access.
 *
 * The API now authorises every protected upload (paid videos, books, ...). <video>, <audio>, <img> and the PDF
 * viewer cannot send an Authorization header, so a signed-in user first obtains a short-lived media token from
 * `/api/media/token` and appends it as `?st=...`. The server still checks, per file, whether this user may see it. */
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL;
const REFRESH_MARGIN_MS = 60 * 1000;

let cache = { accessToken: null, token: null, expiresAt: 0 };
let inflight = null;

export const fetchMediaToken = async (accessToken) => {
  if (!accessToken) return null;
  if (cache.accessToken === accessToken && cache.token && cache.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cache.token;
  if (inflight && inflight.accessToken === accessToken) return inflight.promise;

  const promise = fetch(`${API_URL}/api/media/token`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      if (!body?.token) return null;
      cache = { accessToken, token: body.token, expiresAt: Date.now() + (body.expiresIn || 3600) * 1000 };
      return body.token;
    })
    .catch(() => null)
    .finally(() => { inflight = null; });
  inflight = { accessToken, promise };
  return promise;
};

/* Only URLs that point at this API's uploads get the token (never third-party viewers). */
export const addMediaToken = (url, mediaToken) => {
  if (!url || !mediaToken || typeof url !== 'string') return url;
  if (!url.startsWith(API_URL) || !url.includes('/uploads/')) return url;
  if (/[?&]st=/.test(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + 'st=' + encodeURIComponent(mediaToken);
};

/* Media token for the current session (null while logged out or while it is being fetched). */
export const useMediaToken = () => {
  const accessToken = useSelector((state) => state?.auth?.token);
  const [mediaToken, setMediaToken] = useState(cache.accessToken === accessToken ? cache.token : null);

  useEffect(() => {
    let cancelled = false;
    if (!accessToken) { setMediaToken(null); return undefined; }
    fetchMediaToken(accessToken).then((token) => { if (!cancelled) setMediaToken(token); });
    return () => { cancelled = true; };
  }, [accessToken]);

  return mediaToken;
};

export const useMediaUrl =(url) => addMediaToken(url, useMediaToken());
