<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';

  let payments: any[] = [];
  let loading = true;
  let error = '';

  // Datatable state
  let searchTerm = '';
  let currentPage = 1;
  let itemsPerPage = 10;
  let sortCol = 'created_at';
  let sortDesc = true;

  // Derived state for datatable
  $: filteredPayments = payments.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.company_name && p.company_name.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.rrr && p.rrr.toLowerCase().includes(term)) ||
      (p.transaction_id && p.transaction_id.toLowerCase().includes(term)) ||
      (p.payment_type && p.payment_type.toLowerCase().includes(term))
    );
  });

  $: sortedPayments = [...filteredPayments].sort((a, b) => {
    let valA = a[sortCol] || '';
    let valB = b[sortCol] || '';
    if (sortCol === 'created_at') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (sortCol === 'amount') {
      valA = parseFloat(valA);
      valB = parseFloat(valB);
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  $: totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
  
  // Ensure we don't end up on an empty page if items are filtered
  $: {
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }
  }

  $: paginatedPayments = sortedPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function toggleSort(col: string) {
    if (sortCol === col) {
      sortDesc = !sortDesc;
    } else {
      sortCol = col;
      sortDesc = false;
    }
  }

  async function fetchPayments() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || (role !== 'admin' && role !== 'super_admin')) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/payments', {
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
        payments = data.data;
      } else {
        error = data.error || 'Failed to fetch payments';
      }
    } catch (err: any) {
      error = err.message || 'Network error';
    } finally {
      loading = false;
    }
  }

  onMount(fetchPayments);

  async function verifyPayment(rrr: string) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/remita/verify', {
        method: 'POST',
        credentials: 'include',
          headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rrr })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local state
        payments = payments.map(p => p.rrr === rrr ? { ...p, status: 'successful' } : p);
      } else {
        alert(data.error || 'Failed to verify payment');
      }
    } catch (err) {
      alert('Network error while verifying payment');
    }
  }

  function getStatusColor(status: string) {
    switch(status) {
      case 'successful': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  }
</script>

<div class="row">
  <div class="col-12">
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h4 class="card-title">Payment Records</h4>
          <p class="text-muted mb-0">View all registration and category upgrade payments across the platform.</p>
        </div>
        <div class="d-flex align-items-center mt-3 mt-md-0 gap-3">
          <div class="input-group search-area">
            <input type="text" class="form-control" placeholder="Search payments..." bind:value={searchTerm}>
            <span class="input-group-text"><i class="fas fa-search"></i></span>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        {#if loading}
          <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        {:else if error}
          <div class="alert alert-danger m-4">{error}</div>
        {:else}
          <div class="table-responsive">
            <table class="table table-responsive-md text-black mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="cursor-pointer" on:click={() => toggleSort('company_name')}>
                    Company
                    {#if sortCol === 'company_name'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('payment_type')}>
                    Type
                    {#if sortCol === 'payment_type'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('transaction_id')}>
                    Transaction ID
                    {#if sortCol === 'transaction_id'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('rrr')}>
                    Reference (RRR)
                    {#if sortCol === 'rrr'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('amount')}>
                    Amount
                    {#if sortCol === 'amount'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('created_at')}>
                    Date
                    {#if sortCol === 'created_at'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('status')}>
                    Status
                    {#if sortCol === 'status'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each paginatedPayments as payment}
                  <tr>
                    <td>
                      <div class="d-flex flex-column">
                        <strong class="text-black">{payment.company_name}</strong>
                        <span class="fs-14 text-muted">{payment.email}</span>
                        <span class="fs-12 text-muted">{payment.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-primary light border-0 text-uppercase">{payment.payment_type}</span>
                    </td>
                    <td>
                      <span class="text-black font-monospace">{payment.transaction_id}</span>
                    </td>
                    <td>
                      <span class="text-black font-w500">{payment.rrr || 'N/A'}</span>
                    </td>
                    <td>
                      <strong class="text-black">₦{parseFloat(payment.amount).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span class="d-block text-black">{new Date(payment.created_at).toLocaleDateString()}</span>
                      <span class="fs-12 text-muted">{new Date(payment.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge {payment.status === 'successful' ? 'badge-success' : payment.status === 'failed' ? 'badge-danger' : 'badge-warning'} light border-0">
                          {payment.status}
                        </span>
                        {#if payment.status === 'pending'}
                          <button on:click={() => verifyPayment(payment.rrr)} class="btn btn-primary btn-xxs shadow" title="Retry Validation">Verify</button>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="7" class="text-center p-4">No payment records found.</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center p-3 border-top">
            <div class="text-muted fs-14">
              Showing {(currentPage - 1) * itemsPerPage + (paginatedPayments.length > 0 ? 1 : 0)} to 
              {(currentPage - 1) * itemsPerPage + paginatedPayments.length} of 
              {filteredPayments.length} records
            </div>
            <nav>
              <ul class="pagination pagination-circle m-0">
                <li class="page-item page-indicator {currentPage === 1 ? 'disabled' : ''}">
                  <button class="page-link" on:click={() => currentPage -= 1} disabled={currentPage === 1}><i class="la la-angle-left"></i></button>
                </li>
                {#each Array(totalPages) as _, i}
                  <li class="page-item {currentPage === i + 1 ? 'active' : ''}">
                    <button class="page-link" on:click={() => currentPage = i + 1}>{i + 1}</button>
                  </li>
                {/each}
                <li class="page-item page-indicator {currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                  <button class="page-link" on:click={() => currentPage += 1} disabled={currentPage === totalPages || totalPages === 0}><i class="la la-angle-right"></i></button>
                </li>
              </ul>
            </nav>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
