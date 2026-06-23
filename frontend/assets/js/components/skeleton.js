/**
 * Skeleton loader component
 */
const Skeleton = {
  show(container, type = 'card') {
    if (!container) return;

    switch (type) {
      case 'card':
        container.innerHTML = Array(4).fill(`
          <div class="skeleton skeleton-card" style="margin-bottom: 16px;"></div>
        `).join('');
        break;
      case 'table':
        container.innerHTML = `
          <div class="skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          ${Array(5).fill(`
            <div class="skeleton skeleton-text" style="height: 40px; margin-bottom: 4px;"></div>
          `).join('')}
        `;
        break;
      case 'chart':
        container.innerHTML = `
          <div class="skeleton" style="width: 100%; height: 300px; border-radius: var(--radius-lg);"></div>
        `;
        break;
      case 'text':
        container.innerHTML = `
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text" style="width: 40%;"></div>
        `;
        break;
    }
  },

  remove(container) {
    if (container) {
      container.innerHTML = '';
    }
  },
};