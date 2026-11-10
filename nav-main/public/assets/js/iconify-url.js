/**
 * Iconify icon URLs.
 *
 * Search still returns `prefix:name`, but the SVG endpoint no longer
 * accepts `https://api.iconify.design/prefix:name.svg` (404).
 * The working path is `https://api.iconify.design/prefix/name.svg`.
 * Monochrome SVGs use currentColor, which <img> paints black, so display
 * URLs add a theme color. Palette icons ignore that parameter.
 */

const ICONIFY_HOST = 'api.iconify.design';

export const ICONIFY_COLOR_ON_DARK = '#f2f5f8';
export const ICONIFY_COLOR_ON_LIGHT = '#243140';

function asUrl(value) {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

function isIconify(parsed) {
    return !!parsed && parsed.hostname === ICONIFY_HOST;
}

export function iconifyColorForTheme(isLight) {
    return isLight ? ICONIFY_COLOR_ON_LIGHT : ICONIFY_COLOR_ON_DARK;
}

/**
 * `prefix:name` or an existing Iconify URL → canonical SVG URL without a color query.
 * Anything else returns '' (icon names) or the original string (other URLs / emoji).
 */
export function iconifySvgUrl(iconName) {
    if (!iconName || typeof iconName !== 'string') return '';
    const trimmed = iconName.trim();
    if (/^https?:\/\//i.test(trimmed)) return canonicalIconifyUrl(trimmed);

    const colon = trimmed.indexOf(':');
    if (colon <= 0 || colon >= trimmed.length - 1) return '';
    const prefix = trimmed.slice(0, colon);
    const name = trimmed.slice(colon + 1);
    if (!prefix || !name || prefix.includes('/') || name.includes('/')) return '';
    return `https://${ICONIFY_HOST}/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`;
}

/** Rewrite a legacy colon path. Non-Iconify values pass through. */
export function normalizeIconifyUrl(url) {
    if (!url || typeof url !== 'string') return url || '';
    const trimmed = url.trim();
    const parsed = asUrl(trimmed);
    if (!isIconify(parsed)) return url;

    let path = parsed.pathname;
    try {
        path = decodeURIComponent(path);
    } catch {
        /* keep the raw path */
    }
    const legacy = path.match(/^\/([^/]+):([^/]+)\.svg$/);
    if (legacy) {
        parsed.pathname = `/${legacy[1]}/${legacy[2]}.svg`;
    }
    return parsed.toString();
}

/** Canonical stored URL: slash path, no theme color baked in. */
export function canonicalIconifyUrl(url) {
    if (!url || typeof url !== 'string') return url || '';
    const normalized = normalizeIconifyUrl(url);
    const parsed = asUrl(normalized);
    if (!isIconify(parsed)) return normalized;
    parsed.searchParams.delete('color');
    return parsed.toString();
}

/** Display URL. `color` is applied only to Iconify SVGs and replaces a previous color. */
export function iconifyDisplayUrl(url, color) {
    if (!url || typeof url !== 'string') return url || '';
    const normalized = normalizeIconifyUrl(url);
    const parsed = asUrl(normalized);
    if (!isIconify(parsed) || !color) return normalized;
    parsed.searchParams.set('color', color);
    return parsed.toString();
}

/** Theme-aware display URL. Defaults to the dark-theme glyph color when there is no document. */
export function displayIconUrl(url) {
    let isLight = false;
    if (typeof document !== 'undefined' && document.body?.classList?.contains('light-theme')) {
        isLight = true;
    }
    return iconifyDisplayUrl(url, iconifyColorForTheme(isLight));
}
