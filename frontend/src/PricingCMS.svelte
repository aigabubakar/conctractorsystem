<script lang="ts">
  import { onMount } from 'svelte';
  import Swal from 'sweetalert2';
  import { navigate } from 'svelte-routing';

  let registrationFee = '';
  let categories: any[] = [];
  let loading = true;
  let savingRegistrationFee = false;

  async function fetchData() {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      if (!token || (role !== 'admin' && role !== 'super_admin')) {
        navigate('/login');
        return;
      }

      // Fetch global settings
      const settingsRes = await fetch(import.meta.env.VITE_API_URL + '/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        registrationFee = settingsData.data.registration_fee || '';
      }

      // Fetch categories
      const catRes = await fetch(import.meta.env.VITE_API_URL + '/api/admin/categories', {
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const catData = await catRes.json();
      if (catData.success) {
        categories = catData.data;
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to fetch data', 'error');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchData();
  });

  async function updateRegistrationFee() {
    if (!registrationFee) return Swal.fire('Error', 'Please enter a valid amount', 'warning');
    savingRegistrationFee = true;
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/settings/registration_fee', {
        method: 'PUT',
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: registrationFee })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Updated!', 'Global Registration Fee updated successfully', 'success');
      } else {
        Swal.fire('Error', data.error || 'Failed to update', 'error');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Network error', 'error');
    } finally {
      savingRegistrationFee = false;
    }
  }

  async function updateCategoryFee(categoryId: number, currentFee: string, categoryName: string) {
    const { value: formValues } = await Swal.fire({
      title: 'Update Category',
      html:
        `<div class="mb-3 text-start">
           <label class="form-label">Category Name</label>
           <input id="swal-input-name" class="form-control" value="${categoryName}">
         </div>
         <div class="mb-3 text-start">
           <label class="form-label">Registration Fee (NGN)</label>
           <input id="swal-input-fee" type="number" class="form-control" value="${currentFee}">
         </div>`,
      focusConfirm: false,
      showCancelButton: true,
      allowOutsideClick: false,
      width: '600px',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const fee = (document.getElementById('swal-input-fee') as HTMLInputElement).value;
        if (!name || !fee) {
          Swal.showValidationMessage('Both fields are required');
        }
        return { name, fee };
      }
    });

    if (formValues) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/categories/${categoryId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formValues.name, registration_fee: formValues.fee })
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Updated!', `Category updated successfully`, 'success');
          fetchData(); // Refresh table
        } else {
          Swal.fire('Error', data.error || 'Failed to update category', 'error');
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'Network error', 'error');
      }
    }
  }

  async function addCategory() {
    const { value: formValues } = await Swal.fire({
      title: 'Add New Category',
      html:
        `<div class="mb-3 text-start">
           <label class="form-label">Category Code (e.g. CAT-A)</label>
           <input id="swal-input-code" class="form-control" placeholder="Code">
         </div>
         <div class="mb-3 text-start">
           <label class="form-label">Category Name</label>
           <input id="swal-input-name" class="form-control" placeholder="Name">
         </div>
         <div class="mb-3 text-start">
           <label class="form-label">Registration Fee (NGN)</label>
           <input id="swal-input-fee" type="number" class="form-control" placeholder="Fee">
         </div>`,
      focusConfirm: false,
      showCancelButton: true,
      allowOutsideClick: false,
      width: '600px',
      preConfirm: () => {
        const code = (document.getElementById('swal-input-code') as HTMLInputElement).value;
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const fee = (document.getElementById('swal-input-fee') as HTMLInputElement).value;
        if (!code || !name || !fee) {
          Swal.showValidationMessage('All fields are required');
        }
        return { code, name, fee };
      }
    });

    if (formValues) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/categories`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: formValues.code, name: formValues.name, registration_fee: formValues.fee })
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Added!', `Category added successfully`, 'success');
          fetchData(); // Refresh table
        } else {
          Swal.fire('Error', data.error || 'Failed to add category', 'error');
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'Network error', 'error');
      }
    }
  }

  async function toggleCategoryStatus(id: number, currentStatus: boolean) {
    const action = currentStatus ? 'unpublish' : 'publish';
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${action} this category?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f39c12',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Yes, ${action} it!`
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/categories/${id}/toggle`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ title: 'Success', text: data.message, icon: 'success', timer: 1500, showConfirmButton: false });
          fetchData();
        } else {
          Swal.fire('Error', data.error || 'Failed to toggle status', 'error');
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'Network error', 'error');
      }
    }
  }

  async function deleteCategory(id: number) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/categories/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Deleted!', 'Category has been deleted.', 'success');
          fetchData();
        } else {
          Swal.fire('Error', data.error || 'Failed to delete category', 'error');
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'Network error', 'error');
      }
    }
  }
</script>

<div class="row page-titles">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#!">Admin</a></li>
    <li class="breadcrumb-item active"><a href="#!">Pricing & Fees</a></li>
  </ol>
</div>

{#if loading}
  <div class="text-center py-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
{:else}
      <!-- Global Registration Fee -->
      <div class="row">
        <div class="col-xl-6">
          <div class="card">
            <div class="card-header border-0 pb-0">
              <h4 class="fs-20 mb-0">Global Settings</h4>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label text-primary font-w600">Base Registration Fee (NGN)</label>
                <div class="input-group mb-3">
                  <span class="input-group-text">₦</span>
                  <input type="number" class="form-control" bind:value={registrationFee} placeholder="Enter base registration fee">
                  <button class="btn btn-primary" type="button" on:click={updateRegistrationFee} disabled={savingRegistrationFee}>
                    {#if savingRegistrationFee}
                      <i class="fas fa-spinner fa-spin"></i>
                    {:else}
                      Update
                    {/if}
                  </button>
                </div>
                <small class="text-muted">This is the initial fee contractors pay before selecting a category.</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Pricing Table -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h4 class="card-title mb-0">Contractor Category Fees</h4>
              <button class="btn btn-primary btn-sm" on:click={addCategory}>
                <i class="fas fa-plus me-1"></i> Add Category
              </button>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover table-responsive-sm">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Category Name</th>
                      <th>Contract Value Limit</th>
                      <th>Registration Fee (NGN)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each categories as cat}
                      <tr>
                        <td><span class="badge badge-primary light">{cat.code}</span></td>
                        <td><strong>{cat.name}</strong></td>
                        <td>{cat.contract_value || 'Unlimited'}</td>
                        <td class="text-success font-w600">₦{parseFloat(cat.registration_fee || '0').toLocaleString()}</td>
                        <td>
                          {#if cat.is_active}
                            <span class="badge badge-success">Active</span>
                          {:else}
                            <span class="badge badge-warning">Unpublished</span>
                          {/if}
                        </td>
                        <td>
                          <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-primary shadow-sm me-1" on:click={() => updateCategoryFee(cat.id, cat.registration_fee, cat.name)} title="Edit">
                              <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning shadow-sm me-1" on:click={() => toggleCategoryStatus(cat.id, cat.is_active)} title={cat.is_active ? 'Unpublish' : 'Publish'}>
                              {#if cat.is_active}
                                <i class="fas fa-eye-slash"></i>
                              {:else}
                                <i class="fas fa-eye"></i>
                              {/if}
                            </button>
                            <button class="btn btn-sm btn-outline-danger shadow-sm" on:click={() => deleteCategory(cat.id)} title="Delete">
                              <i class="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
