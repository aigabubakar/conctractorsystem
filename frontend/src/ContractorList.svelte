<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import Swal from 'sweetalert2';
  
  let contractors: any[] = [];
  let loading = true;
  let error = '';
  
  let selectedContractor: any = null;
  let verifying = false;

  // Tabs for status filtering
  let activeTab = 'All';

  // Datatable state
  let searchTerm = '';
  let currentPage = 1;
  let itemsPerPage = 10;
  let sortCol = 'created_at';
  let sortDesc = true;

  $: filteredContractors = contractors.filter(c => {
    // Filter by Tab
    if (activeTab === 'Pending' && (c.verification_status === 'approved' || c.verification_status === 'rejected')) return false;
    if (activeTab === 'Approved' && c.verification_status !== 'approved') return false;
    if (activeTab === 'Rejected' && c.verification_status !== 'rejected') return false;
    
    // Filter by Search
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.company_name && c.company_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  });

  $: sortedContractors = [...filteredContractors].sort((a, b) => {
    let valA = a[sortCol] || '';
    let valB = b[sortCol] || '';
    if (sortCol === 'created_at') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  $: totalPages = Math.ceil(sortedContractors.length / itemsPerPage);
  
  $: {
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }
  }

  $: paginatedContractors = sortedContractors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function toggleSort(col: string) {
    if (sortCol === col) {
      sortDesc = !sortDesc;
    } else {
      sortCol = col;
      sortDesc = false;
    }
  }

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

  const resetContractorPassword = async (id: number) => {
    const newPass = prompt("Enter the new password for this contractor:");
    if (!newPass) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/superadmin/contractors/${id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword: newPass })
      });
      if (res.ok) {
        Swal.fire('Success', 'Contractor password reset successfully!', 'success');
      } else {
        const data = await res.json();
        Swal.fire('Error', data.error || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Network error.', 'error');
    }
  };

  async function updateStatus(id: number, status: string) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Are you sure you want to mark this contractor as ${status}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, do it!'
    });

    if (!result.isConfirmed) return;
    
    verifying = true;
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contractors/${id}/verify`, {
        method: 'POST',
        credentials: 'include',
          headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        contractors = contractors.map(c => 
          c.id === id ? { ...c, verification_status: status } : c
        );
        if (selectedContractor && selectedContractor.id === id) {
          selectedContractor.verification_status = status;
        }
        Swal.fire('Updated!', `Contractor status has been marked as ${status}.`, 'success');
      } else {
        Swal.fire('Error', data.error || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Network error', 'error');
    } finally {
      verifying = false;
    }
  }

  let viewModalOpen = false;
  let viewingDetails: any = null;
  let viewingDocs: any[] = [];
  let viewingPayments: any = null;
  let modalLoading = false;

  async function openViewModal(contractor: any) {
    selectedContractor = contractor;
    viewModalOpen = true;
    modalLoading = true;
    viewingDetails = null;
    viewingDocs = [];
    viewingPayments = null;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contractors/${contractor.id}/details`, {
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        viewingDetails = data.corporate_details;
        viewingDocs = data.documents;
        viewingPayments = data.payments;
      }
    } catch(err) {
      console.error(err);
    } finally {
      modalLoading = false;
    }
  }

  function closeViewModal() {
    viewModalOpen = false;
    selectedContractor = null;
  }
</script>

<div class="row page-titles">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#!">Admin</a></li>
    <li class="breadcrumb-item active"><a href="#!">Contractors List</a></li>
  </ol>
</div>

<div class="row">
  <div class="col-xl-12">
    <div class="d-flex mb-4 justify-content-between align-items-center flex-wrap">
      <div class="card-tabs mt-3 mt-sm-0">
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item">
            <a class="nav-link {activeTab === 'All' ? 'active' : ''}" href="#!" on:click|preventDefault={() => activeTab = 'All'} role="tab">All ({contractors.length})</a>
          </li>
          <li class="nav-item">
            <a class="nav-link {activeTab === 'Pending' ? 'active' : ''}" href="#!" on:click|preventDefault={() => activeTab = 'Pending'} role="tab">Pending</a>
          </li>
          <li class="nav-item">
            <a class="nav-link {activeTab === 'Approved' ? 'active' : ''}" href="#!" on:click|preventDefault={() => activeTab = 'Approved'} role="tab">Approved</a>
          </li>
          <li class="nav-item">
            <a class="nav-link {activeTab === 'Rejected' ? 'active' : ''}" href="#!" on:click|preventDefault={() => activeTab = 'Rejected'} role="tab">Rejected</a>
          </li>
        </ul>
      </div>
      <div class="d-flex align-items-center mt-3 mt-md-0 gap-3">
        <div class="input-group search-area">
          <input type="text" class="form-control" placeholder="Search..." bind:value={searchTerm}>
          <span class="input-group-text"><i class="fas fa-search"></i></span>
        </div>
      </div>
    </div>
    
    <div class="tab-content">
      <div class="tab-pane active show">
        {#if loading}
          <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        {:else if error}
          <div class="alert alert-danger m-4">{error}</div>
        {:else}
          <div class="table-responsive custom-table">
            <table class="table">
              <thead class="thead-light">
                <tr>
                  <th class="cursor-pointer" on:click={() => toggleSort('company_name')}>Company Details</th>
                  <th class="cursor-pointer" on:click={() => toggleSort('category')}>Category</th>
                  <th>Contact</th>
                  <th class="cursor-pointer" on:click={() => toggleSort('verification_status')}>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each paginatedContractors as contractor}
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <a href="#!" class="avatar avatar-lg me-2 flex-shrink-0" on:click|preventDefault={() => openViewModal(contractor)}>
                          <div class="d-flex align-items-center justify-content-center bg-primary text-white w-100 h-100 rounded">
                            <span class="fs-4 fw-bold">{contractor.company_name.charAt(0).toUpperCase()}</span>
                          </div>
                        </a>
                        <div>
                          <h6 class="fw-medium mb-2"><a href="#!" class="text-dark" on:click|preventDefault={() => openViewModal(contractor)}>{contractor.company_name}</a></h6>
                          <div class="d-flex align-items-center">
                            <span class="d-inline-flex fs-12 align-items-center"><i class="isax isax-clock me-1 text-gray-9 fw-bold"></i>Joined {new Date(contractor.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span class="fs-14">{contractor.category || 'Not Selected'}</span></td>
                    <td>
                      <div class="text-nowrap fs-14">
                        <span class="d-block mb-1"><i class="fas fa-envelope text-primary me-2"></i>{contractor.email}</span>
                        <span class="d-block"><i class="fas fa-phone-alt text-primary me-2"></i>{contractor.telephone || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      {#if contractor.verification_status === 'approved'}
                        <span class="badge badge-sm bg-success d-inline-flex align-items-center me-1"><i class="fa-solid fa-circle fs-5 me-1"></i>Approved</span>
                      {:else if contractor.verification_status === 'rejected'}
                        <span class="badge badge-sm bg-danger d-inline-flex align-items-center me-1"><i class="fa-solid fa-circle fs-5 me-1"></i>Rejected</span>
                      {:else}
                        <span class="badge badge-sm bg-info d-inline-flex align-items-center me-1"><i class="fa-solid fa-circle fs-5 me-1"></i>Pending</span>
                      {/if}
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <a href="#!" class="d-inline-flex fs-14 me-2 action-icon" on:click|preventDefault={() => openViewModal(contractor)} title="View Profile"><i class="isax isax-eye"></i></a>
                        {#if contractor.verification_status !== 'approved'}
                          <a href="#!" class="d-inline-flex fs-14 me-2 action-icon text-success" on:click|preventDefault={() => updateStatus(contractor.id, 'approved')} title="Approve"><i class="isax isax-tick-circle"></i></a>
                        {/if}
                        {#if contractor.verification_status !== 'rejected'}
                          <a href="#!" class="d-inline-flex fs-14 action-icon text-danger" on:click|preventDefault={() => updateStatus(contractor.id, 'rejected')} title="Reject"><i class="isax isax-close-circle"></i></a>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="5" class="text-center p-4">No contractors found.</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center p-3">
            <div class="text-muted fs-14">
              Showing {(currentPage - 1) * itemsPerPage + (paginatedContractors.length > 0 ? 1 : 0)} to 
              {(currentPage - 1) * itemsPerPage + paginatedContractors.length} of 
              {filteredContractors.length} results
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

<!-- View Modal placeholder -->
{#if viewModalOpen}
  <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{selectedContractor?.company_name} - Portfolio</h5>
          <div>
            {#if typeof window !== 'undefined' && localStorage.getItem('role') === 'super_admin'}
              <button class="btn btn-sm btn-outline-danger me-2" on:click={() => resetContractorPassword(selectedContractor.id)}>
                <i class="isax isax-key"></i> Reset Password
              </button>
            {/if}
            <button type="button" class="btn-close" on:click={closeViewModal}></button>
          </div>
        </div>
        <div class="modal-body p-4">
          {#if modalLoading}
            <div class="d-flex justify-content-center p-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          {:else}
            <div class="row">
              <!-- Payment Information -->
              <div class="col-12 mb-4">
                <h4 class="fs-18 font-w600 text-primary mb-3"><i class="fas fa-credit-card me-2"></i> Payment Information</h4>
                {#if viewingPayments && (viewingPayments.registration || viewingPayments.category)}
                  <div class="row">
                    {#if viewingPayments.registration}
                      <div class="col-md-6 mb-3">
                        <div class="card shadow-sm h-100 border-primary">
                          <div class="card-header border-0 pb-0">
                            <h5 class="card-title text-primary">Registration Fee</h5>
                          </div>
                          <div class="card-body">
                            <div class="mb-2"><small class="text-muted text-uppercase">RRR Code</small><br><strong class="fs-16">{viewingPayments.registration.rrr}</strong></div>
                            <div class="mb-2"><small class="text-muted text-uppercase">Amount Paid</small><br><strong class="fs-20 text-black">₦{parseFloat(viewingPayments.registration.amount).toLocaleString()}</strong></div>
                            <div><small class="text-muted text-uppercase">Status</small><br>
                              <span class="badge {viewingPayments.registration.status === 'successful' ? 'badge-success' : 'badge-warning'}">{viewingPayments.registration.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                    {#if viewingPayments.category}
                      <div class="col-md-6 mb-3">
                        <div class="card shadow-sm h-100 border-info">
                          <div class="card-header border-0 pb-0">
                            <h5 class="card-title text-info">Category Upgrade</h5>
                          </div>
                          <div class="card-body">
                            <div class="mb-2"><small class="text-muted text-uppercase">RRR Code</small><br><strong class="fs-16">{viewingPayments.category.rrr}</strong></div>
                            <div class="mb-2"><small class="text-muted text-uppercase">Amount Paid</small><br><strong class="fs-20 text-black">₦{parseFloat(viewingPayments.category.amount).toLocaleString()}</strong></div>
                            <div><small class="text-muted text-uppercase">Status</small><br>
                              <span class="badge {viewingPayments.category.status === 'successful' ? 'badge-success' : 'badge-warning'}">{viewingPayments.category.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <div class="alert alert-light">No payment records found.</div>
                {/if}
              </div>

              <!-- Corporate Details -->
              <div class="col-12 mb-4">
                <h4 class="fs-18 font-w600 text-info mb-3"><i class="fas fa-building me-2"></i> Corporate Intelligence</h4>
                {#if viewingDetails}
                  <div class="accordion accordion-primary" id="accordion-corporate">
                    <div class="accordion-item">
                      <div class="accordion-header rounded-lg" id="headingOne" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-controls="collapseOne" aria-expanded="true" role="button">
                        <span class="accordion-header-icon"></span>
                        <span class="accordion-header-text">Basic Information</span>
                        <span class="accordion-header-indicator"></span>
                      </div>
                      <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-bs-parent="#accordion-corporate">
                        <div class="accordion-body-text">
                          <div class="row">
                            <div class="col-sm-4 mb-3"><small class="text-muted text-uppercase">Registration Number</small><br><strong>{viewingDetails.reg_no || '—'}</strong></div>
                            <div class="col-sm-4 mb-3"><small class="text-muted text-uppercase">Date of Registration</small><br><strong>{viewingDetails.reg_date || '—'}</strong></div>
                            <div class="col-sm-4 mb-3"><small class="text-muted text-uppercase">Place of Registration</small><br><strong>{viewingDetails.reg_place || '—'}</strong></div>
                            <div class="col-sm-4 mb-3"><small class="text-muted text-uppercase">Date of Incorporation</small><br><strong>{viewingDetails.date_of_incorporation || '—'}</strong></div>
                            <div class="col-sm-4 mb-3"><small class="text-muted text-uppercase">Paid-up Capital</small><br><strong>{viewingDetails.paid_up_capital ? `₦${Number(viewingDetails.paid_up_capital).toLocaleString()}` : '—'}</strong></div>
                            <div class="col-sm-4 mb-3"><small class="text-muted text-uppercase">Total Assets</small><br><strong>{viewingDetails.total_assets ? `₦${Number(viewingDetails.total_assets).toLocaleString()}` : '—'}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                {:else}
                  <div class="alert alert-light">No corporate details submitted.</div>
                {/if}
              </div>

              <!-- Uploaded Documents -->
              <div class="col-12">
                <h4 class="fs-18 font-w600 text-success mb-3"><i class="fas fa-file-alt me-2"></i> Uploaded Documents</h4>
                {#if viewingDocs && viewingDocs.length > 0}
                  <div class="row">
                    {#each viewingDocs as doc}
                      <div class="col-sm-6 col-md-4 col-xl-3 mb-3">
                        <div class="card h-100 shadow-sm border-success">
                          <div class="card-body p-3 text-center">
                            <div class="display-4 text-success mb-3"><i class="fas fa-file-pdf"></i></div>
                            <h6 class="fs-14 font-w600 mb-3 text-truncate" title={doc.document_id}>{doc.document_id.replace(/_/g, ' ')}</h6>
                            <a href={`${import.meta.env.VITE_API_URL}${doc.file_path}`} target="_blank" class="btn btn-success btn-sm w-100">View Document</a>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="alert alert-light">No documents uploaded.</div>
                {/if}
              </div>

            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
{/if}
