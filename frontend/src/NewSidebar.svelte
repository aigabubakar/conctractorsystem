<script lang="ts">
  import { navigate } from "svelte-routing";
  import { onMount } from "svelte";

  let userRole = 'admin'; // Fallback
  let unreadCount = 0;

  onMount(() => {
    if (typeof window !== 'undefined') {
      userRole = localStorage.getItem('role') || 'admin';
    }
  });

  function handleLogout() {
      localStorage.removeItem("token");
      window.location.replace("/login");
      
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

<div class="sidebar-wrapper bg-white shadow-sm rounded p-3 mb-4" style="min-height: 500px;">
  <ul class="nav flex-column">
      <li class="nav-item mb-2">
          <a class="nav-link text-dark d-flex align-items-center" href={(userRole === 'admin' || userRole === 'super_admin') ? '/admin/dashboard' : '/contractor/dashboard'}>
              <i class="isax isax-home me-2 fs-20 text-primary"></i> Home
          </a>
      </li>
      
      {#if userRole === 'admin' || userRole === 'super_admin'}
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/admin/dashboard">
                  <i class="isax isax-category me-2 fs-20 text-primary"></i> Dashboard
              </a>
          </li>
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/admin/contractors">
                  <i class="isax isax-people me-2 fs-20 text-primary"></i> Contractors
              </a>
          </li>
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/admin/notices">
                  <i class="isax isax-message-notif me-2 fs-20 text-primary"></i> Notices
              </a>
          </li>
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/admin/payments">
                  <i class="isax isax-card me-2 fs-20 text-primary"></i> Payments
              </a>
          </li>
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/admin/verification">
                  <i class="isax isax-verify me-2 fs-20 text-primary"></i> Verification
              </a>
          </li>
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/admin/pricing">
                  <i class="isax isax-wallet-add me-2 fs-20 text-primary"></i> Pricing & CMS
              </a>
          </li>
          
          {#if userRole === 'super_admin'}
              <li class="nav-item mt-3 mb-1 px-3">
                  <span class="text-uppercase text-muted fw-bold" style="font-size: 11px; letter-spacing: 1px;">Super Admin</span>
              </li>
              <li class="nav-item mb-2">
                  <a class="nav-link text-dark d-flex align-items-center" href="/superadmin/staff">
                      <i class="isax isax-security-user me-2 fs-20 text-danger"></i> Manage Staff
                  </a>
              </li>
              <li class="nav-item mb-2">
                  <a class="nav-link text-dark d-flex align-items-center" href="/superadmin/disputes">
                      <i class="isax isax-warning-2 me-2 fs-20 text-danger"></i> Disputes
                  </a>
              </li>
          {/if}
      {:else if userRole === 'contractor'}
          <li class="nav-item mb-2">
              <a class="nav-link text-dark d-flex align-items-center" href="/contractor/dashboard">
                  <i class="isax isax-category me-2 fs-20 text-primary"></i> Dashboard
              </a>
          </li>
      {/if}

      <li class="nav-item mb-2">
          <a class="nav-link text-dark d-flex align-items-center justify-content-between w-100" href={(userRole === 'admin' || userRole === 'super_admin') ? '/admin/messages' : '/contractor/messages'}>
              <div><i class="isax isax-message me-2 fs-20 text-primary"></i> Messages</div>
              {#if unreadCount > 0}
                  <span class="badge bg-danger rounded-pill">{unreadCount}</span>
              {/if}
          </a>
      </li>

      <li class="nav-item mb-2">
          <a class="nav-link text-dark d-flex align-items-center" href={(userRole === 'admin' || userRole === 'super_admin') ? '/profile' : '/contractor/profile'}>
              <i class="isax isax-user me-2 fs-20 text-primary"></i> Profile
          </a>
      </li>
      
      <li class="nav-item mt-4 pt-3 border-top">
          <a class="nav-link text-danger d-flex align-items-center" href="#!" on:click={handleLogout}>
              <i class="isax isax-logout me-2 fs-20 text-danger"></i> Logout
          </a>
      </li>
  </ul>
</div>

<style>
  .nav-link {
      padding: 10px 15px;
      border-radius: 8px;
      transition: all 0.3s;
  }
  .nav-link:hover {
      background-color: #f8f9fa;
      color: var(--bs-primary) !important;
  }
</style>
