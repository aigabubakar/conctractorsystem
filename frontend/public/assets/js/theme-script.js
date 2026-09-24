// Immediately apply the theme based on localStorage

(function() {
  const darkMode = localStorage.getItem('darkMode');
  const isDark = darkMode === 'enabled';
  const themeClass = isDark ? 'dark-mode' : 'light-mode';

  // Apply the theme class to the document immediately
  document.documentElement.className = themeClass;
  if (isDark) {
    document.documentElement.setAttribute('data-theme-mode', 'dark');
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme-mode', 'light');
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }

  // Wait for DOMContentLoaded to set up event listeners
  document.addEventListener('DOMContentLoaded', () => {
      const darkModeToggle = document.getElementById('dark-mode-toggle');
      const lightModeToggle = document.getElementById('light-mode-toggle');

      const toggleMode = (isDarkMode) => {
          document.documentElement.classList.toggle('dark-mode', isDarkMode);
          document.documentElement.classList.toggle('light-mode', !isDarkMode);
          
          if (isDarkMode) {
              document.documentElement.setAttribute('data-theme-mode', 'dark');
              document.documentElement.setAttribute('data-bs-theme', 'dark');
          } else {
              document.documentElement.setAttribute('data-theme-mode', 'light');
              document.documentElement.setAttribute('data-bs-theme', 'light');
          }

          localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
          updateToggleButtons(isDarkMode);
      };

      const updateToggleButtons = (isDarkMode) => {
          if (!darkModeToggle || !lightModeToggle) return;
          if (isDarkMode) {
              darkModeToggle.classList.remove('activate');
              lightModeToggle.classList.add('activate');
          } else {
              lightModeToggle.classList.remove('activate');
              darkModeToggle.classList.add('activate');
          }
      };

      // Initial activation based on current theme
      updateToggleButtons(themeClass === 'dark-mode');

      // Add event listeners if elements are present
      if (darkModeToggle && lightModeToggle) {
          darkModeToggle.addEventListener('click', () => toggleMode(true));
          lightModeToggle.addEventListener('click', () => toggleMode(false));
      }
  });
})();