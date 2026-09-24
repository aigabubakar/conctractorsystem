<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import Swal from 'sweetalert2';

  let contractors: any[] = [];
  let loading = true;
  let error = '';
  
  let selectedContractor: any = null;
  let verifying = false;

  $: totalContractors = contractors.length;
  $: approvedContractors = contractors.filter(c => c.verification_status === 'approved').length;
  $: pendingContractors = contractors.filter(c => c.verification_status === 'pending').length;
  $: rejectedContractors = contractors.filter(c => c.verification_status === 'rejected').length;

  // Datatable state
  let searchTerm = '';


  async function fetchContractors() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || (role !== 'admin' && role !== 'super_admin')) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/contractors', {
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        contractors = data.data;
      } else {
        error = data.error || 'Failed to fetch contractors';
      }
    } catch (err: any) {
      error = err.message || 'Network error';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchContractors();
  });



</script>

<div class="row mb-4">
  <div class="col-xl-3 col-sm-6 mb-3">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="card bg-primary shadow-sm border-0 h-100 clickable-card" role="button" tabindex="0" on:click={() => navigate('/admin/contractors')}>
      <div class="card-body d-flex align-items-center">
        <div class="me-auto text-white">
          <h2 class="text-white fw-bold mb-1">{totalContractors}</h2>
          <span class="fs-16 opacity-75">Total Contractors</span>
        </div>
        <div class="bg-white bg-opacity-25 rounded-circle p-3 d-flex align-items-center justify-content-center">
           <i class="isax isax-profile-2user text-white fs-2"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="col-xl-3 col-sm-6 mb-3">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="card bg-warning shadow-sm border-0 h-100 clickable-card" role="button" tabindex="0" on:click={() => navigate('/admin/contractors')}>
      <div class="card-body d-flex align-items-center">
        <div class="me-auto text-dark">
          <h2 class="text-dark fw-bold mb-1">{pendingContractors}</h2>
          <span class="fs-16 opacity-75">Pending Verifications</span>
        </div>
        <div class="bg-dark bg-opacity-10 rounded-circle p-3 d-flex align-items-center justify-content-center">
           <i class="isax isax-timer text-dark fs-2"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="col-xl-3 col-sm-6 mb-3">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="card bg-success shadow-sm border-0 h-100 clickable-card" role="button" tabindex="0" on:click={() => navigate('/admin/contractors')}>
      <div class="card-body d-flex align-items-center">
        <div class="me-auto text-white">
          <h2 class="text-white fw-bold mb-1">{approvedContractors}</h2>
          <span class="fs-16 opacity-75">Approved</span>
        </div>
        <div class="bg-white bg-opacity-25 rounded-circle p-3 d-flex align-items-center justify-content-center">
           <i class="isax isax-tick-circle text-white fs-2"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="col-xl-3 col-sm-6 mb-3">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="card bg-danger shadow-sm border-0 h-100 clickable-card" role="button" tabindex="0" on:click={() => navigate('/admin/contractors')}>
      <div class="card-body d-flex align-items-center">
        <div class="me-auto text-white">
          <h2 class="text-white fw-bold mb-1">{rejectedContractors}</h2>
          <span class="fs-16 opacity-75">Rejected</span>
        </div>
        <div class="bg-white bg-opacity-25 rounded-circle p-3 d-flex align-items-center justify-content-center">
           <i class="isax isax-close-circle text-white fs-2"></i>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="row mt-4">
  <div class="col-12 text-center">
    <a href="/admin/contractors" on:click|preventDefault={() => navigate('/admin/contractors')} class="btn btn-primary btn-lg rounded-pill shadow">
      <i class="fas fa-list me-2"></i> View All Contractors
    </a>
  </div>
</div>

<style>
  .clickable-card {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .clickable-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
  }
</style>
