export function optionEntriesFromSelect(select) {
  return Array.from(select.options ?? []).map((option, index) => ({
    value: option.value,
    label: (option.textContent || option.value).trim(),
    selected: Boolean(option.selected),
    disabled: Boolean(option.disabled),
    index,
  }));
}

export function selectedOptionIndex(entries, value) {
  const valueIndex = entries.findIndex((entry) => entry.value === value && !entry.disabled);
  if (valueIndex >= 0) return valueIndex;

  const selectedIndex = entries.findIndex((entry) => entry.selected && !entry.disabled);
  if (selectedIndex >= 0) return selectedIndex;

  const firstEnabledIndex = entries.findIndex((entry) => !entry.disabled);
  return firstEnabledIndex >= 0 ? firstEnabledIndex : 0;
}

export function nextOptionIndex(entries, currentIndex, direction) {
  if (!entries.length) return -1;

  for (let step = 1; step <= entries.length; step += 1) {
    const nextIndex = (currentIndex + direction * step + entries.length) % entries.length;
    if (!entries[nextIndex]?.disabled) return nextIndex;
  }

  return currentIndex;
}

function isSelectElement(element) {
  return typeof HTMLSelectElement !== 'undefined' && element instanceof HTMLSelectElement;
}

function optionId(select, entry) {
  return `${select.id || select.name || 'select'}-option-${entry.index}`;
}

export function enhanceSelect(select) {
  if (!isSelectElement(select) || select.dataset.enhancedSelect === 'true') return null;

  select.dataset.enhancedSelect = 'true';
  select.classList.add('native-select--enhanced');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerText = document.createElement('span');
  triggerText.className = 'custom-select__value';
  trigger.append(triggerText);

  const panel = document.createElement('div');
  panel.className = 'custom-select__panel';
  panel.role = 'listbox';
  panel.hidden = true;

  wrapper.append(trigger, panel);
  select.insertAdjacentElement('afterend', wrapper);

  let entries = optionEntriesFromSelect(select);
  let activeIndex = selectedOptionIndex(entries, select.value);

  function syncTrigger() {
    entries = optionEntriesFromSelect(select);
    activeIndex = selectedOptionIndex(entries, select.value);
    const selectedEntry = entries[activeIndex];
    triggerText.textContent = selectedEntry?.label ?? '';
    trigger.setAttribute('aria-activedescendant', selectedEntry ? optionId(select, selectedEntry) : '');
  }

  function updateActive(nextIndex) {
    activeIndex = nextIndex;

    for (const option of panel.querySelectorAll('[role="option"]')) {
      const isActive = Number(option.getAttribute('data-index')) === activeIndex;
      option.classList.toggle('is-active', isActive);
      if (isActive) trigger.setAttribute('aria-activedescendant', option.id);
    }
  }

  function choose(index) {
    const entry = entries[index];
    if (!entry || entry.disabled) return;

    select.value = entry.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncTrigger();
    renderOptions();
    close();
  }

  function renderOptions() {
    entries = optionEntriesFromSelect(select);
    activeIndex = selectedOptionIndex(entries, select.value);
    panel.textContent = '';

    for (const entry of entries) {
      const option = document.createElement('button');
      option.type = 'button';
      option.id = optionId(select, entry);
      option.className = 'custom-select__option';
      option.role = 'option';
      option.dataset.index = String(entry.index);
      option.disabled = entry.disabled;
      option.setAttribute('aria-selected', String(entry.value === select.value));
      option.textContent = entry.label;
      option.addEventListener('mouseenter', () => updateActive(entry.index));
      option.addEventListener('click', () => choose(entry.index));
      panel.append(option);
    }

    updateActive(activeIndex);
  }

  function open() {
    renderOptions();
    panel.hidden = false;
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    panel.hidden = true;
    wrapper.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function toggle() {
    if (panel.hidden) open();
    else close();
  }

  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (panel.hidden) open();
      updateActive(nextOptionIndex(entries, activeIndex, event.key === 'ArrowDown' ? 1 : -1));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (panel.hidden) open();
      else choose(activeIndex);
      return;
    }

    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'Tab') close();
  });

  select.addEventListener('change', () => {
    syncTrigger();
    renderOptions();
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !wrapper.contains(event.target) && event.target !== select) close();
  });

  syncTrigger();
  return wrapper;
}

export function enhanceSelects(root = document) {
  return Array.from(root.querySelectorAll('select[data-styled-select]')).map(enhanceSelect).filter(Boolean);
}
