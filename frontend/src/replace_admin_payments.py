import re

with open(r'c:\Users\BTC\Desktop\contractorregistration\frontend\src\AdminPayments.svelte', 'r', encoding='utf-8') as f:
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
"""

with open(r'c:\Users\BTC\Desktop\contractorregistration\frontend\src\AdminPayments.svelte', 'w', encoding='utf-8') as f:
    f.write(script_part + bootstrap_ui)
