<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';

  let isDarkMode = false;

  let profilePic = '';

  onMount(() => {
    setTimeout(() => {
      const savedTheme = localStorage.getItem('theme-version');
      if (savedTheme) {
        isDarkMode = savedTheme === 'dark';
      } else {
        isDarkMode = document.body.getAttribute('data-theme-version') === 'dark';
      }
    }, 100);

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role') || 'User';
    if (token) {
        const endpoint = (userRole === 'admin' || userRole === 'super_admin') ? '/api/admin/profile' : '/api/contractors/me';
        fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const profile = (userRole === 'admin' || userRole === 'super_admin') ? data.admin : data.data;
                if (profile && profile.profile_pic) {
                    profilePic = `${import.meta.env.VITE_API_URL}${profile.profile_pic}`;
                }
            }
        })
        .catch(err => console.error('Failed to fetch profile in header:', err));
    }
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      document.documentElement.setAttribute('data-theme-mode', 'dark');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
      document.documentElement.setAttribute('data-theme-mode', 'light');
      document.documentElement.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('darkMode', 'disabled');
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.replace('/login');
  }

  const role = localStorage.getItem('role') || 'User';
</script>

<div class="nav-header">
    <a href="#!" class="brand-logo" on:click|preventDefault={() => navigate('/')}>
        <svg class="logo-abbr" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0)">
            <rect class="rect-primary-rect" width="80" height="80" rx="16" fill="#1362FC"/>
            <circle cx="42" cy="19" r="10" fill="white"/>
            <circle cx="75.5" cy="76.5" r="16.5" fill="#12A7FB"/>
            <circle cx="5.5" cy="1.5" r="17.5" fill="#1362FC"/>
            <circle class="rect-primary-rect-1" cx="5.5" cy="1.5" r="16.5" stroke="white" stroke-opacity="0.66" stroke-width="2"/>
            <path d="M33.7656 87.2159C34.9565 76.5246 37.5874 53.6112 38.5845 47.4881V47.4881C39.1698 43.8941 40.2547 47.2322 39.8692 50.8531C38.9933 59.0813 37.1429 74.1221 35.5121 87.4131C33.1225 106.889 33.3507 95.974 33.7635 88.0818" stroke="white" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <defs>
            <clipPath id="clip0">
            <rect class="rect-primary-rect" width="80" height="80" rx="16" fill="white"/>
            </clipPath>
            </defs>
        </svg>
        <div class="brand-title" style="margin-left: 10px; font-weight: bold; font-size: 1.2rem; color: #333;">EDO ROC</div>
    </a>
    <div class="nav-control">
        <div class="hamburger">
            <span class="line"></span><span class="line"></span><span class="line"></span>
        </div>
    </div>
</div>

<div class="chatbox"></div>

<div class="header">
    <div class="header-content">
        <!-- We use inline flex on the nav to bypass the Bootstrap collapse class which was hiding the header -->
        <nav class="navbar navbar-expand" style="display: flex; width: 100%; justify-content: space-between;">
            <div class="header-left">
                <div class="dashboard_bar">
                    Dashboard
                </div>
            </div>
            <ul class="navbar-nav header-right" style="flex-direction: row; align-items: center;">
                
                <li class="nav-item dropdown notification_dropdown">
                    <a class="nav-link bell dz-theme-mode {isDarkMode ? 'active' : ''}" href="#!" on:click|preventDefault={toggleTheme}>
                        <i id="icon-light" class="fas fa-sun"></i>
                        <i id="icon-dark" class="fas fa-moon"></i>
                    </a>
                </li>
                
                <li class="nav-item dropdown header-profile" style="margin-left: 15px;">
                    <a class="nav-link" href="#!" role="button" data-bs-toggle="dropdown">
                        <img src={profilePic || "/images/profile/pic1.jpg"} alt="Profile" />
                        <div class="header-info ms-3">
                            <span>{(role === 'admin' || role === 'super_admin') ? (role === 'super_admin' ? 'Super Administrator' : 'Administrator') : 'Contractor'}</span>
                            <small>{role.toUpperCase()}</small>
                        </div>
                    </a>
                    <div class="dropdown-menu dropdown-menu-end">
                        <a href="#!" class="dropdown-item ai-icon d-flex align-items-center" on:click|preventDefault={() => navigate('/profile')}>
                            <svg id="icon-user1" xmlns="http://www.w3.org/2000/svg" class="text-primary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span class="ms-2">Profile </span>
                        </a>
                        <a href="#!" class="dropdown-item ai-icon d-flex align-items-center" on:click|preventDefault>
                            <svg id="icon-inbox" xmlns="http://www.w3.org/2000/svg" class="text-success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <span class="ms-2">Inbox </span>
                        </a>
                        <a href="#!" on:click|preventDefault={logout} class="dropdown-item ai-icon d-flex align-items-center">
                            <svg id="icon-logout" xmlns="http://www.w3.org/2000/svg" class="text-danger" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            <span class="ms-2">Logout </span>
                        </a>
                    </div>
                </li>
            </ul>
        </nav>
    </div>
</div>
