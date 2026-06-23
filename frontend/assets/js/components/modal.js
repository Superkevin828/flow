/**
 * Modal component
 */
const Modal = {
  currentModal: null,

  show({ title, content, footer, size = 'medium', onClose }) {
    this.close(); // Close any existing modal

    const sizes = {
      small: '360px',
      medium: '520px',
      large: '720px',
    };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: ${sizes[size]}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Close modal">✕</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    // Close handlers
    const closeHandler = () => {
      if (onClose) onClose();
      this.close();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeHandler();
    });

    overlay.querySelector('.modal-close').addEventListener('click', closeHandler);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    this.currentModal = overlay;

    return overlay;
  },

  close() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
      document.body.style.overflow = '';
    }
  },

  confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
    const content = `<p>${message}</p>`;
    const footer = `
      <button class="btn btn-secondary modal-cancel">${cancelText}</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} modal-confirm">${confirmText}</button>
    `;

    const modal = this.show({ title, content, footer });

    modal.querySelector('.modal-cancel').addEventListener('click', () => this.close());
    modal.querySelector('.modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.close();
    });
  },

  alert({ title, message, confirmText = 'OK', onConfirm }) {
    const content = `<p>${message}</p>`;
    const footer = `
      <button class="btn btn-primary modal-confirm">${confirmText}</button>
    `;

    const modal = this.show({ title, content, footer });

    modal.querySelector('.modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      this.close();
    });
  },
};