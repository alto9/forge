(function () {
  const vscode = acquireVsCodeApi();
  const content = document.getElementById('content');

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderBlocked() {
    content.innerHTML = '';
    const warn = el('div', 'warning');
    warn.appendChild(el('div', 'warning-icon', '⚠'));
    const text = el('div', '');
    text.appendChild(el('div', 'warning-title', 'Invalid Forge Repository'));
    text.appendChild(
      el(
        'div',
        'warning-body',
        'This workspace does not have a Forge memory repo. Initialize the project before opening role dashboards.'
      )
    );
    warn.appendChild(text);
    content.appendChild(warn);

    content.appendChild(
      el(
        'p',
        'hint',
        'Run /forge.init-project in the command palette to set up .ai/memory.'
      )
    );

    const row = el('div', 'btn-row');
    const initBtn = el('button', 'btn btn-primary', 'Initialize Project');
    initBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'initProject' });
    });
    const courseBtn = el('button', 'btn btn-secondary', 'Open Forge Course');
    courseBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'openCourse' });
    });
    row.appendChild(initBtn);
    row.appendChild(courseBtn);
    content.appendChild(row);
  }

  function renderActive(state) {
    content.innerHTML = '';

    const roleBlock = el('div', '');
    roleBlock.appendChild(el('div', 'label', 'ROLE'));
    const select = el('select', 'select');
    select.setAttribute('aria-label', 'Role');
    (state.roles || []).forEach((role) => {
      const opt = document.createElement('option');
      opt.value = role.id;
      opt.textContent = role.label;
      if (role.id === state.selectedRole) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      vscode.postMessage({ type: 'setRole', roleId: select.value });
    });
    roleBlock.appendChild(select);
    content.appendChild(roleBlock);

    const row = el('div', 'btn-row');
    const dashBtn = el('button', 'btn btn-primary', 'Open Dashboard');
    dashBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'openDashboard' });
    });
    const courseBtn = el('button', 'btn btn-secondary', 'Open Forge Course');
    courseBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'openCourse' });
    });
    row.appendChild(dashBtn);
    row.appendChild(courseBtn);
    content.appendChild(row);

    content.appendChild(el('div', 'spacer'));
    content.appendChild(el('div', 'footer', 'Memory repo synced'));
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'state') return;
    if (msg.mode === 'active') {
      renderActive(msg);
    } else {
      renderBlocked();
    }
  });

  vscode.postMessage({ type: 'ready' });
})();
