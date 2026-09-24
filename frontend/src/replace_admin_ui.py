import re

with open(r'c:\Users\BTC\Desktop\contractorregistration\frontend\src\AdminDashboard.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

ui_start = content.find('<div class="p-6 md:p-10')
if ui_start == -1:
    ui_start = content.find('<div class="')

script_part = content[:ui_start]

bootstrap_ui = """<div class="row">
  <div class="col-12">
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h4 class="card-title">Contractor Management</h4>
          <p class="text-muted mb-0">Review, approve, and manage registered contractors on the platform.</p>
        </div>
        <div class="d-flex align-items-center mt-3 mt-md-0 gap-3">
          <button on:click={openAdminEditModal} class="btn btn-outline-primary btn-sm">
            <i class="fas fa-cog me-2"></i> Settings
          </button>
          <div class="input-group search-area">
            <input type="text" class="form-control" placeholder="Search contractors..." bind:value={searchTerm}>
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
                    Company Details
                    {#if sortCol === 'company_name'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('email')}>
                    Contact
                    {#if sortCol === 'email'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('category')}>
                    Category
                    {#if sortCol === 'category'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="cursor-pointer" on:click={() => toggleSort('verification_status')}>
                    Status
                    {#if sortCol === 'verification_status'}<i class="fas {sortDesc ? 'fa-sort-down' : 'fa-sort-up'} ms-1"></i>{/if}
                  </th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each paginatedContractors as contractor}
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="ms-3">
                          <h6 class="fs-16 font-w600 mb-0"><a href="#" on:click|preventDefault={() => openViewModal(contractor)} class="text-black">{contractor.company_name}</a></h6>
                          <span class="fs-14 text-muted">Joined {new Date(contractor.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="d-block">{contractor.email}</span>
                      <span class="fs-14 text-muted">{contractor.telephone}</span>
                    </td>
                    <td>
                      <span class="badge badge-primary light border-0">{contractor.category || 'N/A'}</span>
                    </td>
                    <td>
                      <div class="d-flex flex-column align-items-start gap-1">
                        <span class="badge {contractor.verification_status === 'approved' ? 'badge-success' : contractor.verification_status === 'rejected' ? 'badge-danger' : 'badge-warning'} light border-0">
                          {getStatusLabel(contractor.verification_status)}
                        </span>
                        <span class="badge badge-light">Docs: {contractor.document_count || 0}/11</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex justify-content-end gap-2">
                        <button on:click={() => openViewModal(contractor)} class="btn btn-primary shadow btn-xs sharp" title="View"><i class="fas fa-eye"></i></button>
                        {#if contractor.verification_status !== 'approved'}
                          <button on:click={() => updateStatus(contractor.id, 'approved')} disabled={verifying} class="btn btn-success shadow btn-xs sharp" title="Approve"><i class="fas fa-check"></i></button>
                        {/if}
                        {#if contractor.verification_status !== 'rejected'}
                          <button on:click={() => updateStatus(contractor.id, 'rejected')} disabled={verifying} class="btn btn-danger shadow btn-xs sharp" title="Reject"><i class="fas fa-times"></i></button>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="5" class="text-center p-4">No contractors registered yet.</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center p-3 border-top">
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
          <button type="button" class="btn-close" on:click={closeViewModal}></button>
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
                    
                    <div class="accordion-item">
                      <div class="accordion-header rounded-lg collapsed" id="headingTwo" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-controls="collapseTwo" role="button" aria-expanded="false">
                        <span class="accordion-header-icon"></span>
                        <span class="accordion-header-text">Key Personnel</span>
                        <span class="accordion-header-indicator"></span>
                      </div>
                      <div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-bs-parent="#accordion-corporate">
                        <div class="accordion-body-text">
                          <div class="row">
                            <div class="col-md-4 mb-3"><strong class="text-primary d-block mb-1">Chief Executive Officer</strong>{viewingDetails.ceo_name || 'Not Provided'}</div>
                            <div class="col-md-4 mb-3"><strong class="text-primary d-block mb-1">Chairman</strong>{viewingDetails.chairman_name || 'Not Provided'}<br><small>{viewingDetails.chairman_phone || ''}</small></div>
                            <div class="col-md-4 mb-3"><strong class="text-primary d-block mb-1">Secretary</strong>{viewingDetails.secretary_name || 'Not Provided'}<br><small>{viewingDetails.secretary_phone || ''}</small></div>
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
                            <a href={`http://localhost:3000${doc.file_path}`} target="_blank" class="btn btn-success btn-sm w-100">View Document</a>
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

<!-- Admin Settings Modal -->
{#if adminEditModalOpen}
  <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Admin Profile Settings</h5>
          <button type="button" class="btn-close" on:click={() => adminEditModalOpen = false}></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input type="text" class="form-control" bind:value={adminEditData.username} placeholder="Username">
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" bind:value={adminEditData.email} placeholder="Email (optional)">
          </div>
          <hr>
          <h6 class="mb-3">Change Password</h6>
          <div class="mb-3">
            <label class="form-label">Current Password</label>
            <input type="password" class="form-control" bind:value={adminEditData.current_password} placeholder="Current Password">
          </div>
          <div class="mb-3">
            <label class="form-label">New Password</label>
            <input type="password" class="form-control" bind:value={adminEditData.new_password} placeholder="New Password">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger light" on:click={() => adminEditModalOpen = false}>Close</button>
          <button type="button" class="btn btn-primary" on:click={updateAdminProfile} disabled={isUpdatingAdmin}>
            {#if isUpdatingAdmin}<i class="fas fa-spinner fa-spin me-2"></i>{/if} Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
{/if}
"""

with open(r'c:\Users\BTC\Desktop\contractorregistration\frontend\src\AdminDashboard.svelte', 'w', encoding='utf-8') as f:
    f.write(script_part + bootstrap_ui)
