// Custom copy functionality - adds "Copy as Plain Text" option
document.addEventListener('DOMContentLoaded', () => {
  // Function to convert markdown to plain text
  const markdownToPlainText = (markdown) => {
    let text = markdown;

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      // Extract just the code content without the fence
      const lines = match.split('\n');
      return lines.slice(1, -1).join('\n');
    });

    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove headers (keep the text)
    text = text.replace(/^#{1,6}\s+/gm, '');

    // Remove bold/italic markers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');

    // Convert links to just text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove images
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Remove horizontal rules
    text = text.replace(/^[-*_]{3,}\s*$/gm, '');

    // Remove blockquotes markers
    text = text.replace(/^>\s+/gm, '');

    // Remove list markers
    text = text.replace(/^[\s]*[-*+]\s+/gm, '- ');
    text = text.replace(/^[\s]*\d+\.\s+/gm, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Remove Hugo shortcodes
    text = text.replace(/\{\{<[^>]+>\}\}/g, '');
    text = text.replace(/\{\{%[^%]+%\}\}/g, '');

    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim
    text = text.trim();

    return text;
  };

  // Helper to close dropdown
  const closeDropdown = (container) => {
    if (!container) return;

    const toggle = container.querySelector('.hextra-page-context-menu-toggle');
    const menu = container.querySelector('.hextra-page-context-menu-dropdown');

    if (!toggle || !menu) return;

    const chevron = toggle.querySelector('[data-chevron]');
    toggle.dataset.state = 'closed';
    menu.classList.add('hx:hidden');
    if (chevron) {
      chevron.style.transform = '';
    }
  };

  // Handle "Copy as Plain Text" action
  document.querySelectorAll('.hextra-page-context-menu-dropdown button[data-action="copy-text"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const container = btn.closest('.hextra-page-context-menu');
      if (!container) return;

      const copyBtn = container.querySelector('.hextra-page-context-menu-copy');
      if (!copyBtn) return;

      const url = copyBtn.dataset.url;
      if (!url) return;

      closeDropdown(container);

      try {
        // Fetch the markdown content
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const markdown = await response.text();

        // Convert to plain text
        const plainText = markdownToPlainText(markdown);

        // Copy to clipboard
        await navigator.clipboard.writeText(plainText);

        // Show success feedback
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 1000);
      } catch (error) {
        console.error('Failed to copy as plain text:', error);
      }
    });
  });
});
