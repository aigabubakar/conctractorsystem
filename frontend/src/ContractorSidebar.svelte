<script lang="ts">
  import { navigate } from "svelte-routing";
  import { onMount } from "svelte";

  let currentPath = window.location.pathname;
  let unreadCount = 0;

  function navigateTo(path) {
    navigate(path);
    currentPath = window.location.pathname;
  }

  async function fetchUnreadCount() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/messages/unread-count', {
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        unreadCount = data.count;
      }
    } catch (err) {
      console.error(err);
    }
  }

  onMount(() => {
    fetchUnreadCount();
    window.addEventListener('unreadMessagesUpdate', (e: any) => {
      unreadCount = e.detail.count;
    });
  });
</script>

<div class="settings-sidebar mb-lg-0">
  <div>
    <h6 class="mb-3">Main Menu</h6>
    <ul class="mb-3 pb-1">
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/dashboard')} 
           class="d-inline-flex align-items-center {currentPath === '/contractor/dashboard' || currentPath === '/' ? 'active' : ''}">
           <i class="isax isax-grid-35 me-2"></i>Dashboard
        </a>
      </li>
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/profile')} 
           class="d-inline-flex align-items-center {currentPath.includes('profile') ? 'active' : ''}">
           <i class="fa-solid fa-user me-2"></i>My Profile
        </a>
      </li>
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/documents')} 
           class="d-inline-flex align-items-center {currentPath.includes('documents') ? 'active' : ''}">
           <i class="isax isax-note-215 me-2"></i>Documents
        </a>
      </li>
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/verification')} 
           class="d-inline-flex align-items-center {currentPath.includes('verification') ? 'active' : ''}">
           <i class="isax isax-verify5 me-2"></i>Verification
        </a>
      </li>
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/messages')} 
           class="d-inline-flex align-items-center justify-content-between w-100 {currentPath.includes('messages') ? 'active' : ''}">
           <div><i class="isax isax-messages-35 me-2"></i>Messages</div>
           {#if unreadCount > 0}
               <span class="badge bg-danger rounded-pill">{unreadCount}</span>
           {/if}
        </a>
      </li>
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/payments')} 
           class="d-inline-flex align-items-center {currentPath.includes('payments') ? 'active' : ''}">
           <i class="isax isax-wallet-money me-2"></i>Transactions
        </a>
      </li>
    </ul>
    <hr>
    <h6 class="mb-3">Account Settings</h6>
    <ul>
      <li>
        <a href="#!" 
           on:click={() => navigateTo('/contractor/settings')} 
           class="d-inline-flex align-items-center {currentPath.includes('settings') ? 'active' : ''}">
           <i class="isax isax-setting-25 me-2"></i>Settings
        </a>
      </li>
      <li>
        <a href="#!" 
           on:click={() => { localStorage.removeItem('token'); window.location.replace('/login'); }} 
           class="d-inline-flex align-items-center">
           <i class="isax isax-logout5 me-2"></i>Logout
        </a>
      </li>
    </ul>
  </div>
</div>
