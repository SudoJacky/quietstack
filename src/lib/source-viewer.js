function parseLines(value) {
  const parseLineNumber = (line) => {
    const match = String(line ?? '').trim().match(/^L?(\d+)$/i);
    return match ? Number.parseInt(match[1], 10) : Number.NaN;
  };

  const [start, end = start] = String(value ?? '').split('-').map(parseLineNumber);
  if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end >= start) {
    return { start, end };
  }

  return undefined;
}

function decodeFragment(value) {
  try {
    return decodeURIComponent(String(value ?? '').replaceAll('+', ' '));
  } catch {
    return String(value ?? '');
  }
}

function parseLocatorFragment(rawFragment) {
  const fragment = String(rawFragment ?? '');
  const params = new URLSearchParams(rawFragment);
  const heading = params.get('heading');
  const lines = parseLines(params.get('lines') ?? params.get('line'));

  if (heading || lines) return { heading, lines };
  if (fragment.includes('=')) return { invalidFragment: decodeFragment(fragment) };

  const bareFragment = decodeFragment(rawFragment).trim();
  if (!bareFragment) return {};

  const bareLines = parseLines(bareFragment);
  if (bareLines) return { lines: bareLines };

  return { heading: bareFragment };
}

export function sourceHashFromLocator(locator) {
  const params = new URLSearchParams({ source: locator.id });

  if (locator.heading) params.set('heading', locator.heading);
  if (locator.lines) params.set('lines', `${locator.lines.start}-${locator.lines.end}`);

  return `#${params.toString().replaceAll('+', '%20')}`;
}

export function parseSourceHash(hash) {
  const value = String(hash ?? '').replace(/^#/, '');
  const params = new URLSearchParams(value);
  const id = params.get('source');
  if (!id) return undefined;

  const locator = { id };
  const heading = params.get('heading');
  const lines = parseLines(params.get('lines') ?? params.get('line'));

  if (heading) locator.heading = heading;
  if (lines) locator.lines = lines;

  return locator;
}

export function parseSourceHref(href) {
  if (!href?.startsWith('source:')) return undefined;

  const value = href.slice('source:'.length);
  const [id, rawFragment = ''] = value.split('#');
  if (!id) return undefined;

  const locator = { id };
  const { heading, lines, invalidFragment } = parseLocatorFragment(rawFragment);

  if (heading) locator.heading = heading;

  if (lines) locator.lines = lines;
  if (invalidFragment) locator.invalidFragment = invalidFragment;

  return locator;
}

export function headingSlug(value) {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');
}

export function buildSourceLines(markdown) {
  return String(markdown ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((text, index) => {
      const headingMatch = text.match(/^#{1,6}\s+(.+?)\s*#*$/);
      const headingText = headingMatch?.[1]?.trim();

      return {
        number: index + 1,
        text,
        headingSlug: headingText ? headingSlug(headingText) : undefined,
      };
    });
}

export function duplicateSourceHeadingSlugs(markdown) {
  const seen = new Set();
  const duplicates = new Set();

  for (const line of buildSourceLines(markdown)) {
    if (!line.headingSlug) continue;
    if (seen.has(line.headingSlug)) duplicates.add(line.headingSlug);
    seen.add(line.headingSlug);
  }

  return [...duplicates];
}

function isSectionLocator(value) {
  return /^\d+(?:\.\d+)*\.?$/.test(value);
}

function matchesHeadingLocator(lineSlug, locatorHeading) {
  if (!lineSlug || !locatorHeading) return false;

  const locatorSlug = headingSlug(locatorHeading);
  if (lineSlug === locatorHeading || lineSlug === locatorSlug) return true;

  if (!isSectionLocator(locatorSlug)) return false;

  const sectionSlug = locatorSlug.replace(/\.$/, '');
  return lineSlug.startsWith(`${sectionSlug}-`) || lineSlug.startsWith(`${sectionSlug}.-`);
}

export function findHighlightLines(lines, locator) {
  if (locator?.lines) return locator.lines;

  if (locator?.heading) {
    const heading = lines.find((line) => matchesHeadingLocator(line.headingSlug, locator.heading));
    if (heading) return { start: heading.number, end: heading.number };
  }

  return undefined;
}

export function sourceLineScrollTop(container, highlightedLine) {
  return Math.max(0, highlightedLine.offsetTop - container.clientHeight / 2 + highlightedLine.clientHeight / 2);
}

export function pulseSourceLink(link, { className = 'is-source-activated', setTimeoutFn = globalThis.setTimeout } = {}) {
  if (!link?.classList) return undefined;

  link.classList.remove(className);
  void link.offsetWidth;
  link.classList.add(className);

  return setTimeoutFn(() => link.classList.remove(className), 520);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderSourceLines(source, locator) {
  const lines = buildSourceLines(source.body);
  const highlight = findHighlightLines(lines, locator);
  const hasLocator = Boolean(locator?.heading || locator?.lines);
  const unmatchedNotice =
    hasLocator && !highlight
      ? '<p class="source-viewer__notice" data-source-viewer-notice>No exact source location matched.</p>'
      : '';

  return (
    unmatchedNotice +
    lines
    .map((line) => {
      const isHighlighted = highlight && line.number >= highlight.start && line.number <= highlight.end;
      return `
        <div class="source-line${isHighlighted ? ' is-highlighted' : ''}" data-source-line="${line.number}">
          <span class="source-line__number">${line.number}</span>
          <code>${escapeHtml(line.text) || ' '}</code>
        </div>
      `;
    })
    .join('')
  );
}

export function initSourceViewer(root = document) {
  const viewer = root.querySelector('[data-source-viewer]');
  const sourceData = root.querySelector('[data-source-viewer-data]');
  if (!viewer || !sourceData) return;

  const title = viewer.querySelector('[data-source-viewer-title]');
  const meta = viewer.querySelector('[data-source-viewer-meta]');
  const content = viewer.querySelector('[data-source-viewer-content]');
  const empty = viewer.querySelector('[data-source-viewer-empty]');
  const pdfLink = viewer.querySelector('[data-source-viewer-pdf]');
  const copyButton = viewer.querySelector('[data-source-viewer-copy]');
  const closeButton = viewer.querySelector('[data-source-viewer-close]');
  const sources = new Map(JSON.parse(sourceData.textContent || '[]').map((source) => [source.id, source]));
  let currentSourceHash;

  function showViewer() {
    viewer.hidden = false;
    viewer.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => viewer.classList.add('is-open'));
  }

  function closeViewer() {
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    currentSourceHash = undefined;

    if (window.location.hash.startsWith('#source=')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }

  function openSource(locator) {
    const source = sources.get(locator.id);
    if (!source || !content || !title || !meta || !empty || !pdfLink) return;

    title.textContent = source.title;
    meta.textContent = source.path ? `${source.id} / ${source.path}` : source.id;
    content.innerHTML = renderSourceLines(source, locator);
    empty.hidden = true;
    currentSourceHash = sourceHashFromLocator(locator);
    showViewer();

    if (source.pdf) {
      pdfLink.hidden = false;
      pdfLink.setAttribute('href', source.pdf);
    } else {
      pdfLink.hidden = true;
      pdfLink.removeAttribute('href');
    }

    const highlighted = content.querySelector('.source-line.is-highlighted');
    if (highlighted) {
      content.scrollTop = sourceLineScrollTop(content, highlighted);
    }
  }

  viewer.addEventListener('transitionend', (event) => {
    if (event.target === viewer && !viewer.classList.contains('is-open')) {
      viewer.hidden = true;
    }
  });

  closeButton?.addEventListener('click', closeViewer);

  copyButton?.addEventListener('click', async () => {
    if (!currentSourceHash) return;

    const url = `${window.location.origin}${window.location.pathname}${window.location.search}${currentSourceHash}`;
    await navigator.clipboard?.writeText(url);
    copyButton.textContent = 'Copied';
    window.setTimeout(() => {
      copyButton.textContent = 'Copy link';
    }, 1500);
  });

  const initialLocator = parseSourceHash(window.location.hash);
  if (initialLocator) openSource(initialLocator);

  window.addEventListener('hashchange', () => {
    const locator = parseSourceHash(window.location.hash);
    if (locator) openSource(locator);
  });

  root.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="source:"]') : undefined;
    if (!link) return;

    const locator = parseSourceHref(link.getAttribute('href'));
    if (!locator) return;

    event.preventDefault();
    pulseSourceLink(link);
    openSource(locator);
    window.history.replaceState(null, '', sourceHashFromLocator(locator));
  });
}
