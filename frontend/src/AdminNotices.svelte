<script lang="ts">
  import { onMount } from "svelte";
  import AdminLiteLayout from "./AdminLiteLayout.svelte";

  let notices = [];
  let loading = true;
  let error = "";
  
  // Form state
  let showModal = false;
  let editingId = null;
  let title = "";
  let content = "";
  let priority = "normal";
  let is_active = true;
  let submitting = false;

  async function fetchNotices() {
    loading = true;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/admin/notices", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) notices = data.data;
    } catch (err) {
      error = "Failed to load notices.";
    } finally {
      loading = false;
    }
  }

  onMount(fetchNotices);

  function openModal(notice = null) {
    if (notice) {
      editingId = notice.id;
      title = notice.title;
      content = notice.content;
      priority = notice.priority;
      is_active = notice.is_active === 1;
    } else {
      editingId = null;
      title = "";
      content = "";
      priority = "normal";
      is_active = true;
    }
    showModal = true;
  }

  async function saveNotice(e) {
    e.preventDefault();
    submitting = true;
    const token = localStorage.getItem("token");
    const method = editingId ? "PUT" : "POST";
    const url = editingId 
      ? `${import.meta.env.VITE_API_URL}/api/admin/notices/${editingId}`
      : `${import.meta.env.VITE_API_URL}/api/admin/notices`;

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, priority, is_active: is_active ? 1 : 0 })
      });
      const data = await res.json();
      if (data.success) {
        showModal = false;
        fetchNotices();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to save notice.");
    } finally {
      submitting = false;
    }
  }

  async function deleteNotice(id) {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notices/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchNotices();
    } catch (err) {
      alert("Delete failed.");
    }
  }
</script>

<AdminLiteLayout>
  <div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0 fw-bold">Notice Board Management</h2>
      <button class="btn btn-primary shadow-sm rounded-pill px-4" on:click={() => openModal()}>
        <i class="isax isax-add-circle me-2"></i> Create Notice
      </button>
    </div>

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
    {:else if error}
      <div class="alert alert-danger">{error}</div>
    {:else}
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th class="ps-4">Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each notices as notice}
                <tr>
                  <td class="ps-4 fw-medium">{notice.title}</td>
                  <td>
                    {#if notice.priority === 'high'}
                      <span class="badge bg-danger">High</span>
                    {:else}
                      <span class="badge bg-secondary">Normal</span>
                    {/if}
                  </td>
                  <td>
                    {#if notice.is_active}
                      <span class="badge bg-success bg-opacity-10 text-success">Active</span>
                    {:else}
                      <span class="badge bg-dark bg-opacity-10 text-dark">Inactive</span>
                    {/if}
                  </td>
                  <td class="text-muted">{new Date(notice.created_at).toLocaleDateString()}</td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light me-2" on:click={() => openModal(notice)}>
                      <i class="isax isax-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-light text-danger" on:click={() => deleteNotice(notice.id)}>
                      <i class="isax isax-trash"></i>
                    </button>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="5" class="text-center py-5 text-muted">No notices found.</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>

  <!-- Modal -->
  {#if showModal}
    <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold">{editingId ? 'Edit Notice' : 'New Notice'}</h5>
            <button type="button" class="btn-close" on:click={() => showModal = false}></button>
          </div>
          <div class="modal-body p-4">
            <form on:submit={saveNotice}>
              <div class="mb-3">
                <label class="form-label fw-medium">Notice Title</label>
                <input type="text" class="form-control" bind:value={title} required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium">Message Content</label>
                <textarea class="form-control" rows="4" bind:value={content} required></textarea>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-medium">Priority</label>
                  <select class="form-select" bind:value={priority}>
                    <option value="normal">Normal</option>
                    <option value="high">High (Red Banner)</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-end pb-2">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="activeSwitch" bind:checked={is_active}>
                    <label class="form-check-label" for="activeSwitch">Active</label>
                  </div>
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light" on:click={() => showModal = false}>Cancel</button>
                <button type="submit" class="btn btn-primary px-4" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  {/if}
</AdminLiteLayout>
