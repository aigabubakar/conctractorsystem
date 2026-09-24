<script lang="ts">
  import { onMount } from "svelte";
  
  let admins: any[] = [];
  let loading = true;
  let newUsername = "";
  let newPassword = "";
  let newRole = "admin"; // or super_admin
  let creating = false;

  const fetchAdmins = async () => {
    loading = true;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/superadmin/admins', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) admins = data;
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    fetchAdmins();
  });

  const createAdmin = async () => {
    if (!newUsername || !newPassword) return alert('Username and password are required.');
    creating = true;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/superadmin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Staff account created successfully!');
        newUsername = "";
        newPassword = "";
        newRole = "admin";
        fetchAdmins();
      } else {
        alert(data.error || 'Failed to create staff account.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating staff account.');
    } finally {
      creating = false;
    }
  };

  const deleteAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff account?')) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/superadmin/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetPassword = async (id: number) => {
    const newPass = prompt("Enter the new password for this account:");
    if (!newPass) return;
    
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/superadmin/admins/${id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword: newPass })
      });
      if (res.ok) {
        alert("Password reset successfully!");
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
    }
  };
</script>

<div class="d-flex justify-content-between align-items-center mb-4">
  <h4 class="fw-bold mb-0 text-dark"><i class="isax isax-security-user me-2 text-danger"></i> Manage Staff (Admins)</h4>
</div>

<div class="row">
  <div class="col-lg-4 mb-4">
    <div class="card border-0 shadow-sm rounded">
      <div class="card-header bg-white border-bottom">
        <h5 class="mb-0 fw-bold">Create New Staff</h5>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">Username</label>
          <input type="text" class="form-control" bind:value={newUsername} placeholder="Enter username">
        </div>
        <div class="mb-3">
          <label class="form-label text-muted small fw-bold">Temporary Password</label>
          <input type="text" class="form-control" bind:value={newPassword} placeholder="Enter password">
        </div>
        <div class="mb-4">
          <label class="form-label text-muted small fw-bold">Role</label>
          <select class="form-select" bind:value={newRole}>
            <option value="admin">Admin (Standard)</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button class="btn btn-primary w-100" on:click={createAdmin} disabled={creating}>
          {#if creating}
            <span class="spinner-border spinner-border-sm me-2"></span> Creating...
          {:else}
            <i class="isax isax-add-circle me-1"></i> Create Account
          {/if}
        </button>
      </div>
    </div>
  </div>

  <div class="col-lg-8">
    <div class="card border-0 shadow-sm rounded">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4">ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created At</th>
                <th class="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#if loading}
                <tr><td colspan="5" class="text-center py-4">Loading staff accounts...</td></tr>
              {:else if admins.length === 0}
                <tr><td colspan="5" class="text-center py-4">No staff accounts found.</td></tr>
              {:else}
                {#each admins as admin}
                  <tr>
                    <td class="ps-4 text-muted">#{admin.id}</td>
                    <td class="fw-bold">{admin.username}</td>
                    <td>
                      {#if admin.role === 'super_admin'}
                        <span class="badge bg-danger rounded-pill px-3">Super Admin</span>
                      {:else}
                        <span class="badge bg-primary rounded-pill px-3">Admin</span>
                      {/if}
                    </td>
                    <td class="text-muted small">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td class="pe-4 text-end">
                      <button class="btn btn-sm btn-outline-secondary me-2" on:click={() => resetPassword(admin.id)} title="Reset Password">
                        <i class="isax isax-key"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" on:click={() => deleteAdmin(admin.id)} title="Delete Account">
                        <i class="isax isax-trash"></i>
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
