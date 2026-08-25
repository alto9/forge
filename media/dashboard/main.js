(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById('app');
  let state = null;
  let activeTab = 'brief';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null || value === '') return [];
    return [value];
  }

  function formatItem(item) {
    if (item == null) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      if (item.metric != null && item.target != null) {
        return item.metric + ' → ' + item.target;
      }
      if (item.name || item.title) {
        return String(item.name || item.title);
      }
      if (item.hypothesis) {
        return String(item.hypothesis);
      }
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    }
    return String(item);
  }

  function cardTitle(item) {
    if (item == null) return 'Untitled';
    if (typeof item === 'string') return item;
    return item.name || item.title || item.id || 'Untitled';
  }

  function cardSub(item) {
    if (item == null || typeof item === 'string') return '';
    return (
      item.hypothesis ||
      item.description ||
      item.success ||
      item.jobs ||
      item.result ||
      ''
    );
  }

  function renderFieldValue(field, value) {
    const wrap = el('div', '');
    if (isEmpty(value)) {
      wrap.appendChild(el('div', 'readonly empty', 'Empty'));
      return wrap;
    }

    if (field.display === 'tags') {
      const tags = el('div', 'tags');
      asArray(value).forEach((v) => {
        tags.appendChild(el('span', 'tag', formatItem(v)));
      });
      wrap.appendChild(tags);
      return wrap;
    }

    if (field.display === 'list' || field.display === 'metricPairs') {
      const list = el('ul', 'list');
      asArray(value).forEach((v) => {
        list.appendChild(el('li', '', formatItem(v)));
      });
      if (!Array.isArray(value) && typeof value === 'string') {
        wrap.appendChild(el('div', 'readonly', value));
        return wrap;
      }
      wrap.appendChild(list);
      return wrap;
    }

    if (field.display === 'cards') {
      const cards = el('div', '');
      asArray(value).forEach((item) => {
        const card = el('div', 'card');
        card.appendChild(el('div', 'card-title', cardTitle(item)));
        const sub = cardSub(item);
        if (sub) card.appendChild(el('div', 'card-sub', String(sub)));
        cards.appendChild(card);
      });
      wrap.appendChild(cards);
      return wrap;
    }

    // text
    const text =
      typeof value === 'string'
        ? value
        : Array.isArray(value)
          ? value.map(formatItem).join('\n')
          : formatItem(value);
    wrap.appendChild(el('div', 'readonly', text));
    return wrap;
  }

  function renderPlaceholder(message, title) {
    app.innerHTML = '';
    const box = el('div', 'placeholder');
    if (title) box.appendChild(el('h2', '', title));
    box.appendChild(el('p', '', message));
    app.appendChild(box);
  }

  function renderPoDashboard() {
    app.innerHTML = '';
    const data = state;

    const toolbar = el('div', 'toolbar');
    const left = el('div', 'toolbar-left');
    left.appendChild(
      el('span', 'dashboard-title', data.dashboardTitle || data.roleLabel || 'Product Owner')
    );
    toolbar.appendChild(left);

    const right = el('div', 'toolbar-right');
    const badge = el(
      'span',
      data.hostConnected ? 'badge' : 'badge badge-muted',
      data.hostLabel || 'Host unknown'
    );
    right.appendChild(badge);
    right.appendChild(el('span', '', data.memoryPathDisplay || ''));
    toolbar.appendChild(right);
    app.appendChild(toolbar);

    const tabs = el('div', 'tabs');
    (data.tabs || []).forEach((tab) => {
      const btn = el('button', 'tab' + (tab.id === activeTab ? ' active' : ''), tab.label);
      btn.addEventListener('click', () => {
        activeTab = tab.id;
        render();
      });
      tabs.appendChild(btn);
    });
    app.appendChild(tabs);

    const tab = (data.tabs || []).find((t) => t.id === activeTab) || data.tabs[0];
    if (!tab) return;

    const panel = el('div', 'panel');
    panel.appendChild(el('div', 'alert', tab.alert));

    if (tab.placeholder) {
      panel.appendChild(el('div', 'placeholder', tab.placeholder));
      app.appendChild(panel);
      return;
    }

    const form = el('div', 'form');
    const doc = (data.docs && tab.docKey && data.docs[tab.docKey]) || { frontmatter: {} };
    const fm = doc.frontmatter || {};

    (tab.fields || []).forEach((field) => {
      const block = el('div', 'field');
      const header = el('div', 'field-header');
      header.appendChild(el('span', 'field-label', field.label));
      const actionBtn = el('button', 'action-btn', field.action.label);
      actionBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'action', actionId: field.action.id });
      });
      header.appendChild(actionBtn);
      block.appendChild(header);
      block.appendChild(renderFieldValue(field, fm[field.key]));
      form.appendChild(block);
    });

    panel.appendChild(form);
    app.appendChild(panel);
  }

  function render() {
    if (!state) {
      renderPlaceholder('Loading dashboard…');
      return;
    }
    if (state.kind === 'placeholder') {
      renderPlaceholder(state.message, state.title);
      return;
    }
    if (state.kind === 'error') {
      renderPlaceholder(state.message, 'Dashboard unavailable');
      return;
    }
    renderPoDashboard();
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'dashboardData') return;
    state = msg;
    if (msg.activeTab) activeTab = msg.activeTab;
    else if (!(msg.tabs || []).some((t) => t.id === activeTab)) {
      activeTab = (msg.tabs && msg.tabs[0] && msg.tabs[0].id) || 'brief';
    }
    render();
  });

  vscode.postMessage({ type: 'ready' });
})();
