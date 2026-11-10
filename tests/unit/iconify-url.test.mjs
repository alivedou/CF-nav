import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    ICONIFY_COLOR_ON_DARK,
    ICONIFY_COLOR_ON_LIGHT,
    canonicalIconifyUrl,
    displayIconUrl,
    iconifyColorForTheme,
    iconifyDisplayUrl,
    iconifySvgUrl,
    normalizeIconifyUrl
} from '../../nav-main/public/assets/js/iconify-url.js';

describe('iconify icon urls', () => {
    it('turns search hits prefix:name into a slash SVG path', () => {
        assert.equal(
            iconifySvgUrl('mdi:github'),
            'https://api.iconify.design/mdi/github.svg'
        );
        assert.equal(
            iconifySvgUrl('line-md:github-twotone'),
            'https://api.iconify.design/line-md/github-twotone.svg'
        );
    });

    it('does not build the retired colon path that Iconify now 404s', () => {
        const url = iconifySvgUrl('ri:github-fill');
        assert.equal(url.includes('ri:github-fill'), false);
        assert.match(url, /\/ri\/github-fill\.svg$/);
    });

    it('rewrites already stored colon URLs, including percent-encoded colons', () => {
        assert.equal(
            normalizeIconifyUrl('https://api.iconify.design/mdi:github.svg'),
            'https://api.iconify.design/mdi/github.svg'
        );
        assert.equal(
            normalizeIconifyUrl('https://api.iconify.design/mdi%3Agithub.svg'),
            'https://api.iconify.design/mdi/github.svg'
        );
    });

    it('leaves slash URLs, emoji, and other hosts alone', () => {
        const slash = 'https://api.iconify.design/mdi/github.svg';
        assert.equal(normalizeIconifyUrl(slash), slash);
        assert.equal(canonicalIconifyUrl('📂'), '📂');
        assert.equal(
            normalizeIconifyUrl('https://icons.duckduckgo.com/ip3/github.com.ico'),
            'https://icons.duckduckgo.com/ip3/github.com.ico'
        );
    });

    it('stores icons without a theme color and paints one only for display', () => {
        const stored = canonicalIconifyUrl(
            'https://api.iconify.design/mdi:github.svg?color=%23ffffff'
        );
        assert.equal(stored, 'https://api.iconify.design/mdi/github.svg');

        const dark = iconifyDisplayUrl(stored, iconifyColorForTheme(false));
        const light = iconifyDisplayUrl(stored, ICONIFY_COLOR_ON_LIGHT);
        assert.equal(dark, `https://api.iconify.design/mdi/github.svg?color=${encodeURIComponent(ICONIFY_COLOR_ON_DARK)}`);
        assert.match(light, /color=/);
        assert.equal(iconifyDisplayUrl('https://example.com/a.png', ICONIFY_COLOR_ON_DARK), 'https://example.com/a.png');
    });

    it('displayIconUrl without a document uses the dark-theme glyph color', () => {
        const url = displayIconUrl('https://api.iconify.design/mdi:home.svg');
        assert.match(url, /\/mdi\/home\.svg\?color=/);
        assert.match(url, new RegExp(encodeURIComponent(ICONIFY_COLOR_ON_DARK)));
    });
});
