<script lang="ts">
  import { onMount } from 'svelte';

  let documents = [];
  let isLoading = true;
  let isUploading = false;
  let uploadMessage = '';
  let uploadError = '';

  let selectedFile: File | null = null;
  let selectedType = '';

  let hasCorporateDetails = false;

  const documentTypes = [
      'CAC Certificate',
      'Tax Clearance',
      'PENCOM Certificate',
      'NSITF Certificate',
      'ITF Certificate',
      'BPP Registration',
      'Sworn Affidavit',
      'Company Profile',
      'Other'
  ];

  async function fetchDocuments() {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
          const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/me', {
              credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
              documents = data.data.documents || [];
              hasCorporateDetails = !!data.data.corporate_details;
          }
      } catch (err) {
          console.error('Failed to fetch documents', err);
      } finally {
          isLoading = false;
      }
  }

  onMount(() => {
      fetchDocuments();
  });

  function handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
          if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
              uploadError = 'Only PDF files are allowed.';
              event.target.value = ''; // clear input
              selectedFile = null;
              return;
          }
          uploadError = '';
          selectedFile = file;
      }
  }

  async function uploadDocument(event) {
      event.preventDefault();
      
      if (!selectedFile) {
          uploadError = 'Please select a file to upload.';
          return;
      }
      if (!selectedType) {
          uploadError = 'Please select a document type.';
          return;
      }

      uploadError = '';
      uploadMessage = '';
      isUploading = true;

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type', selectedType);

      try {
          const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/upload-document', {
              method: 'POST',
              credentials: 'include',
          headers: {
                  'Authorization': `Bearer ${token}`
              },
              body: formData
          });

          const data = await res.json();
          if (data.success) {
              uploadMessage = 'Document uploaded successfully!';
              selectedFile = null;
              selectedType = '';
              // Reset the file input visually
              event.target.reset();
              // Refresh the documents list
              fetchDocuments();
          } else {
              uploadError = data.error || 'Failed to upload document.';
          }
      } catch (err) {
          uploadError = 'An error occurred during upload. Please try again.';
          console.error(err);
      } finally {
          isUploading = false;
      }
  }

  function getFileIcon(path: string) {
      if (!path) return 'isax-document-text';
      const ext = path.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(ext)) return 'isax-document-text text-danger';
      if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'isax-image text-primary';
      return 'isax-document-text text-muted';
  }

  function formatDate(dateString: string) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  }
</script>

<div class="row">
    <!-- Upload Section -->
    <div class="col-lg-4 col-md-12">
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
                <h5 class="card-title fw-bold">Upload Document</h5>
            </div>
            <div class="card-body">
                <p class="text-muted small mb-4">Upload your required registration and compliance documents here.</p>
                
                {#if !isLoading && !hasCorporateDetails}
                    <div class="alert alert-warning p-3 small mb-4">
                        <i class="isax isax-warning-2 text-warning me-2"></i>
                        <strong>Action Required:</strong> You must complete your Corporate Details in the <a href="/contractor/verification">Verification</a> section before you can upload any documents.
                    </div>
                {/if}

                {#if uploadError}
                    <div class="alert alert-danger p-2 small">{uploadError}</div>
                {/if}
                {#if uploadMessage}
                    <div class="alert alert-success p-2 small">{uploadMessage}</div>
                {/if}

                <form on:submit={uploadDocument}>
                    <div class="mb-3">
                        <label class="form-label fw-medium">Document Type</label>
                        <select class="form-select" bind:value={selectedType} required disabled={!hasCorporateDetails || isLoading}>
                            <option value="" disabled>Select Type...</option>
                            {#each documentTypes as type}
                                <option value={type}>{type}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-medium">Select File</label>
                        <input type="file" class="form-control" on:change={handleFileChange} accept=".pdf" required disabled={!hasCorporateDetails || isLoading}>
                        <div class="form-text mt-2 text-danger">Supported format: PDF only</div>
                    </div>

                    <button type="submit" class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center" disabled={!hasCorporateDetails || isUploading || isLoading}>
                        {#if isUploading}
                            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Uploading...
                        {:else}
                            <i class="isax isax-document-upload me-2"></i> Upload Document
                        {/if}
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Documents List Section -->
    <div class="col-lg-8 col-md-12">
        <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom-0 pt-4 pb-0">
                <h5 class="card-title fw-bold">My Documents</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover table-borderless align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-4">Document</th>
                                <th>Type</th>
                                <th>Date Uploaded</th>
                                <th class="text-end pe-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#if isLoading}
                                <tr>
                                    <td colspan="4" class="text-center py-5">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            {:else if documents.length === 0}
                                <tr>
                                    <td colspan="4" class="text-center py-5">
                                        <div class="mb-3">
                                            <i class="isax isax-folder-cross text-muted" style="font-size: 3rem;"></i>
                                        </div>
                                        <h6 class="text-muted">No documents uploaded yet</h6>
                                        <p class="small text-muted">Use the form on the left to upload your first document.</p>
                                    </td>
                                </tr>
                            {:else}
                                {#each documents as doc}
                                    <tr>
                                        <td class="ps-4 py-3">
                                            <div class="d-flex align-items-center">
                                                <div class="bg-light rounded p-2 me-3">
                                                    <i class="isax {getFileIcon(doc.file_path)} fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 class="mb-0 fw-medium text-truncate" style="max-width: 200px;" title={doc.file_path.split('/').pop()}>
                                                        {doc.file_path.split('/').pop()}
                                                    </h6>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-soft-primary text-primary px-2 py-1">{doc.document_type}</span>
                                        </td>
                                        <td>
                                            <div class="small text-muted">{formatDate(doc.uploaded_at)}</div>
                                        </td>
                                        <td class="text-end pe-4">
                                            <a href="{import.meta.env.VITE_API_URL}{doc.file_path}" target="_blank" class="btn btn-sm btn-light rounded-pill px-3">
                                                <i class="isax isax-eye text-primary me-1"></i> View
                                            </a>
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
