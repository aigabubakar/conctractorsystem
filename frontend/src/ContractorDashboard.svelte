<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import Swal from 'sweetalert2';

  let profile: any = null;
  let loading = true;
  let error = '';
  let notices: any[] = [];
  
  let requiredDocs = [
    { id: 'cac', title: 'Certificate of Incorporation (CAC 1, 2 & 7)' },
    { id: 'tax_clearance', title: 'Three (3) years Tax Clearance (2023, 2024 and 2025)' },
    { id: 'development_levy', title: 'Development Levy' },
    { id: 'project_evidence', title: 'Evidence of previous Project execution' },
    { id: 'vat', title: 'VAT Registration Certificate' },
    { id: 'pencom', title: 'PENCOM Compliance Certificate' },
    { id: 'itf', title: 'ITF Compliance Certificate' },
    { id: 'affidavit', title: 'Sworn Affidavit of non-conviction' },
    { id: 'bank_reference', title: 'Bank Reference letter' },
    { id: 'bank_statement', title: 'Bank Statement (six months)' },
    { id: 'tin', title: 'TIN Registration Certificate' }
  ];

  function isDocUploaded(id: string) {
    if (!profile || !profile.documents) return false;
    return profile.documents.some((d: any) => d.document_type === id);
  }

  function getUploadedCount() {
    if (!profile || !profile.documents) return 0;
    return requiredDocs.filter(d => isDocUploaded(d.id)).length;
  }

  onMount(async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'contractor') {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/me', {
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
        profile = data.data;
      } else {
        error = data.error || 'Failed to load profile';
      }
    } catch (err: any) {
      error = err.message || 'Network error';
    }

    try {
      const noticesRes = await fetch(import.meta.env.VITE_API_URL + '/api/notices', {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const noticesData = await noticesRes.json();
      if (noticesData.success) {
        notices = noticesData.data;
      }
    } catch (err) {
      console.error("Failed to load notices");
    } finally {
      loading = false;
    }
  });

  let editModalOpen = false;
  let activeTab = 'profile'; // 'profile' or 'password'
  let editProfile = { company_name: '', email: '', telephone: '', location_address: '', postal_address: '' };
  let passwordData = { current_password: '', new_password: '' };
  let isUpdating = false;

  function openEditModal() {
    editProfile = {
      company_name: profile.company_name,
      email: profile.email,
      telephone: profile.telephone,
      location_address: profile.location_address,
      postal_address: profile.postal_address
    };
    passwordData = { current_password: '', new_password: '' };
    activeTab = 'profile';
    editModalOpen = true;
  }

  async function updateProfile() {
    isUpdating = true;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/update-profile', {
        method: 'PUT',
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfile)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire('Success', data.message, 'success');
        profile = { ...profile, ...editProfile };
        editModalOpen = false;
      } else {
        Swal.fire('Error', data.error || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Network error', 'error');
    } finally {
      isUpdating = false;
    }
  }

  async function updatePassword() {
    if (!passwordData.current_password || !passwordData.new_password) {
      Swal.fire('Warning', 'Both current and new password are required.', 'warning');
      return;
    }
    isUpdating = true;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/update-password', {
        method: 'PUT',
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire('Success', data.message, 'success');
        editModalOpen = false;
      } else {
        Swal.fire('Error', data.error || 'Failed to update password', 'error');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Network error', 'error');
    } finally {
      isUpdating = false;
    }
  }
</script>

{#if loading}
  <div class="d-flex align-items-center justify-content-center p-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
{:else if error}
  <div class="p-5">
    <div class="alert alert-danger">
      <h4 class="alert-heading">Error</h4>
      <p>{error}</p>
    </div>
  </div>
{:else if profile}
  <!-- Registration Status Alert -->
  <div class="row mb-4">
    <div class="col-12">
      {#if profile.verification_status === 'approved'}
        <div class="alert alert-success solid alert-dismissible fade show mb-0">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="me-2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          <strong>Registration Fully Active!</strong> Congratulations! Your account has been verified and you have full access to the portal.
        </div>
      {:else if profile.verification_status === 'pending' || getUploadedCount() === requiredDocs.length}
        <div class="alert alert-info solid alert-dismissible fade show d-flex align-items-center justify-content-between flex-wrap gap-3 mb-0">
          <div>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="me-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <strong>Documents Under Review!</strong> Your documents have been received and are pending administrator approval.
          </div>
          <button on:click={() => navigate('/contractor/verification')} class="btn btn-light btn-sm text-info font-w600">
            View Verification Center
          </button>
        </div>
      {:else}
        <div class="alert alert-warning alert-dismissible fade show d-flex align-items-center justify-content-between flex-wrap gap-3 mb-0">
          <div class="text-dark">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="me-2 text-warning"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <strong>Action Required:</strong> Your profile registration is incomplete. Please proceed to the Verification Center to submit the remaining <strong>{requiredDocs.length - getUploadedCount()} mandatory documents</strong>.
          </div>
          <button on:click={() => navigate('/contractor/verification')} class="btn btn-dark btn-sm font-w600">
            Go to Verification Center
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Notices Widget -->
  {#if notices && notices.length > 0}
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
            <h5 class="fw-bold mb-0 text-primary d-flex align-items-center">
              <i class="isax isax-notification me-2 fs-24"></i> Important Notices
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex flex-column gap-3">
              {#each notices as notice}
                <div class="p-3 rounded-3 {notice.priority === 'high' ? 'bg-danger bg-opacity-10 border border-danger border-opacity-25' : 'bg-primary bg-opacity-10 border border-primary border-opacity-25'}">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold mb-0 {notice.priority === 'high' ? 'text-danger' : 'text-primary'}">
                      {notice.title}
                    </h6>
                    <small class="text-muted">{new Date(notice.created_at).toLocaleDateString()}</small>
                  </div>
                  <p class="mb-0 text-dark small">{notice.content}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Stats Cards -->
  <div class="row">
    <div class="col-xxl col-lg-4 col-md-6">
      <div class="card bg-success">
        <div class="card-body">
          <h6 class="fw-medium mb-1 text-white">Docs Uploaded</h6>
          <h4 class="fw-bold text-white">{getUploadedCount()}</h4>
        </div>
      </div>
    </div>
    <div class="col-xxl col-lg-4 col-md-6">
      <div class="card bg-secondary">
        <div class="card-body">
          <h6 class="fw-medium mb-1 text-white">Required Docs</h6>
          <h4 class="fw-bold text-white">{requiredDocs.length}</h4>
        </div>
      </div>
    </div>
    <div class="col-xxl col-lg-4 col-md-6">
      <div class="card bg-info">
        <div class="card-body">
          <h6 class="fw-medium mb-1 text-white">Completion</h6>
          <h4 class="fw-bold text-white">{Math.round((getUploadedCount() / requiredDocs.length) * 100)}%</h4>
        </div>
      </div>
    </div>
    <div class="col-xxl col-lg-4 col-md-6">
      <div class="card bg-skyblue">
        <div class="card-body">
          <h6 class="fw-medium mb-1 text-white">Status</h6>
          <h4 class="fw-bold text-white text-capitalize">{profile.verification_status}</h4>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- Company Details -->
    <div class="col-xl-12">
      <div class="card">
        <div class="card-body">
          <div class="post-details">
            <div class="d-flex align-items-center justify-content-between mb-4">
              <h3 class="mb-0 text-black">Company Details</h3>
              <div class="dropdown">
                <button class="btn btn-primary btn-sm" on:click={openEditModal}><i class="isax isax-edit-2 me-2"></i>Edit Details</button>
              </div>
            </div>
            
            <div class="row mb-5">
              <div class="col-sm-6 mb-4">
                <p class="fs-14 mb-1 text-uppercase text-muted font-w600">Company Name</p>
                <h5 class="fs-18 font-w600 text-black">{profile.company_name}</h5>
              </div>
              <div class="col-sm-6 mb-4">
                <p class="fs-14 mb-1 text-uppercase text-muted font-w600">Registration Date</p>
                <h5 class="fs-18 font-w600 text-black"><i class="fas fa-calendar-week me-2 text-primary"></i>{new Date(profile.created_at).toLocaleDateString()}</h5>
              </div>
              <div class="col-sm-6 mb-4">
                <p class="fs-14 mb-1 text-uppercase text-muted font-w600">Phone Number</p>
                <h5 class="fs-18 font-w600 text-black">{profile.telephone}</h5>
              </div>
              <div class="col-sm-6 mb-4">
                <p class="fs-14 mb-1 text-uppercase text-muted font-w600">TIN Number</p>
                <h5 class="fs-18 font-w600 text-black">{profile.tin}</h5>
              </div>
              <div class="col-sm-12 mb-4">
                <p class="fs-14 mb-1 text-uppercase text-muted font-w600">Physical Location Address</p>
                <h5 class="fs-18 font-w600 text-black text-break"><i class="fas fa-map-marker-alt me-2 text-primary"></i>{profile.location_address}</h5>
              </div>
              <div class="col-sm-12">
                <p class="fs-14 mb-1 text-uppercase text-muted font-w600">Postal Address</p>
                <h5 class="fs-18 font-w600 text-black text-break">{profile.postal_address || 'Not Provided'}</h5>
              </div>
            </div>

            <div class="profile-skills mt-5 mb-3">
              <h4 class="text-primary mb-3">Required Documents Checklist</h4>
              <div class="d-flex flex-wrap gap-2">
                {#each requiredDocs as doc}
                  {#if isDocUploaded(doc.id)}
                    <span class="btn btn-success light btn-sm mb-1"><i class="fas fa-check-circle me-2"></i>{doc.title}</span>
                  {:else}
                    <span class="btn btn-outline-danger btn-sm mb-1"><i class="fas fa-times-circle me-2"></i>{doc.title}</span>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if editModalOpen}
  <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5); z-index: 1050;">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Settings</h5>
          <button type="button" class="btn-close" on:click={() => editModalOpen = false}></button>
        </div>
        
        <!-- Tabs -->
        <div class="card-header border-0 pb-0 pt-3">
          <ul class="nav nav-tabs" role="tablist">
            <li class="nav-item">
              <button 
                class="nav-link {activeTab === 'profile' ? 'active' : ''}" 
                on:click={() => activeTab = 'profile'}
              >Basic Information</button>
            </li>
            <li class="nav-item">
              <button 
                class="nav-link {activeTab === 'password' ? 'active' : ''}" 
                on:click={() => activeTab = 'password'}
              >Change Password</button>
            </li>
          </ul>
        </div>
        
        <div class="modal-body">
          {#if activeTab === 'profile'}
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">CAC Number</label>
                <input value={profile.cac_number} disabled type="text" class="form-control bg-light text-muted" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">TIN</label>
                <input value={profile.tin} disabled type="text" class="form-control bg-light text-muted" />
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">Company Name</label>
                <input bind:value={editProfile.company_name} type="text" class="form-control" />
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">Email Address</label>
                <input bind:value={editProfile.email} type="email" class="form-control" />
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">Phone Number</label>
                <input bind:value={editProfile.telephone} type="text" class="form-control" />
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">Location Address</label>
                <textarea bind:value={editProfile.location_address} rows="2" class="form-control"></textarea>
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">Postal Address</label>
                <textarea bind:value={editProfile.postal_address} rows="2" class="form-control"></textarea>
              </div>
            </div>
          {:else}
            <div class="row">
              <div class="col-12 mb-3">
                <label class="form-label">Current Password</label>
                <input bind:value={passwordData.current_password} type="password" class="form-control" />
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">New Password</label>
                <input bind:value={passwordData.new_password} type="password" class="form-control" />
              </div>
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-danger light" on:click={() => editModalOpen = false}>Close</button>
          {#if activeTab === 'profile'}
            <button type="button" class="btn btn-primary" on:click={updateProfile} disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save changes'}</button>
          {:else}
            <button type="button" class="btn btn-primary" on:click={updatePassword} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update Password'}</button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
