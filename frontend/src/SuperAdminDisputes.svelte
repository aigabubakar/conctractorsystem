<script lang="ts">
  import { onMount } from "svelte";
  
  let disputes: any[] = [];
  let loading = true;

  const fetchDisputes = async () => {
    loading = true;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/superadmin/disputes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) disputes = data;
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    fetchDisputes();
  });

  const resolveDispute = async (id: number) => {
    const resolution = prompt("Enter resolution notes for this dispute:");
    if (resolution === null) return; // Cancelled
    
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/superadmin/disputes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action: 'resolve', resolution: resolution || 'Resolved by Super Admin' })
      });
      if (res.ok) {
        alert("Dispute marked as resolved!");
        fetchDisputes();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to resolve dispute.');
      }
    } catch (err) {
      console.error(err);
    }
  };
</script>

<div class="d-flex justify-content-between align-items-center mb-4">
  <h4 class="fw-bold mb-0 text-dark"><i class="isax isax-warning-2 me-2 text-danger"></i> Transaction Disputes</h4>
</div>

<div class="card border-0 shadow-sm rounded">
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="ps-4">Transaction ID</th>
            <th>Company</th>
            <th>Amount (₦)</th>
            <th>Dispute Reason</th>
            <th>Status</th>
            <th class="pe-4 text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if loading}
            <tr><td colspan="6" class="text-center py-4">Loading disputes...</td></tr>
          {:else if disputes.length === 0}
            <tr><td colspan="6" class="text-center py-4 text-muted">No disputed transactions found.</td></tr>
          {:else}
            {#each disputes as dispute}
              <tr>
                <td class="ps-4 text-muted fw-bold">{dispute.transaction_id}</td>
                <td>
                  <div class="fw-bold">{dispute.company_name}</div>
                  <div class="small text-muted">{dispute.email}</div>
                </td>
                <td class="fw-bold">₦{Number(dispute.amount).toLocaleString()}</td>
                <td style="max-width: 250px;">
                  <div class="text-truncate text-danger fw-bold" title={dispute.dispute_reason}>
                    {dispute.dispute_reason || 'N/A'}
                  </div>
                  {#if dispute.dispute_status === 'resolved'}
                    <div class="small text-success mt-1" title={dispute.dispute_resolution}>
                      <i class="isax isax-tick-circle me-1"></i> {dispute.dispute_resolution || 'Resolved'}
                    </div>
                  {/if}
                </td>
                <td>
                  {#if dispute.dispute_status === 'open'}
                    <span class="badge bg-danger rounded-pill px-3 py-2">OPEN</span>
                  {:else if dispute.dispute_status === 'resolved'}
                    <span class="badge bg-success rounded-pill px-3 py-2">RESOLVED</span>
                  {:else}
                    <span class="badge bg-secondary rounded-pill px-3 py-2">{dispute.dispute_status.toUpperCase()}</span>
                  {/if}
                </td>
                <td class="pe-4 text-end">
                  {#if dispute.dispute_status === 'open'}
                    <button class="btn btn-sm btn-success fw-bold" on:click={() => resolveDispute(dispute.id)}>
                      Resolve Dispute
                    </button>
                  {:else}
                    <button class="btn btn-sm btn-light text-muted" disabled>Resolved</button>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
