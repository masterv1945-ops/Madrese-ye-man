
try {
  const savedTheme = localStorage.getItem('schoolpanel.theme');
  if (/^(teal|purple|blue|green|orange)-(light|dark)$/.test(savedTheme || '')) {
    const [palette, mode] = savedTheme.split('-');
    document.documentElement.dataset.theme = palette;
    document.documentElement.dataset.mode = mode;
  }
} catch (_) {}
