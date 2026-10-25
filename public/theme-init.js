try {
  var t = localStorage.getItem('theme') || 'system'
  var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  if (d) document.documentElement.classList.add('dark')
} catch (e) {}
