<script lang="ts">
  import NewHeader from './NewHeader.svelte';
  import NewSidebar from './NewSidebar.svelte';

  // Reactive token check to instantly defeat back-button caching
  $: {
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
          if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
              window.location.replace('/login');
          }
      }
  }
</script>

<div class="main-wrapper">
  <NewHeader />
  
  <div class="content-wrapper" style="padding: 40px 0; background-color: #f5f6fa;">
    <div class="container-fluid pe-5 ps-5">
      <div class="row">
        <!-- Sidebar Column -->
        <div class="col-lg-2 col-md-3">
          <NewSidebar />
        </div>
        
        <!-- Main Content Column -->
        <div class="col-lg-10 col-md-9">
          <div class="main-content bg-white shadow-sm rounded p-4" style="min-height: 500px;">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
