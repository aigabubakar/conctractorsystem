<script lang="ts">
  import { onMount } from 'svelte';
  import Swal from 'sweetalert2';
  import { navigate } from 'svelte-routing';
  
  let role = '';
  let messages: any[] = [];
  let contractors: any[] = [];
  let unreadCount = 0;
  
  let activeView = 'inbox'; // 'inbox', 'sent', 'compose', 'read'
  let selectedMessage: any = null;
  
  // Compose state
  let receiverId = '';
  let subject = '';
  let body = '';
  let isReplying = false;

  onMount(async () => {
    role = localStorage.getItem('role') || '';
    if (!role) {
      navigate('/login');
      return;
    }
    
    await fetchMessages('inbox');
    
    if ((role === 'admin' || role === 'super_admin')) {
      await fetchContractors();
    }
  });

  async function fetchMessages(type = 'inbox') {
    activeView = type;
    const token = localStorage.getItem('token');
    try {
      const endpoint = type === 'sent' ? import.meta.env.VITE_API_URL + '/api/messages/sent' : import.meta.env.VITE_API_URL + '/api/messages';
      const res = await fetch(endpoint, {
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        messages = data.data;
        if (type === 'inbox') {
          unreadCount = messages.filter(m => !m.is_read).length;
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdate', { detail: { count: unreadCount } }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchContractors() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/admin/contractors', {
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        contractors = data.data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function openMessage(msg: any) {
    selectedMessage = msg;
    activeView = 'read';
    
    if (!msg.is_read && activeView !== 'sent') { // only mark read if in inbox
      const token = localStorage.getItem('token');
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${msg.id}/read`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        msg.is_read = 1;
        messages = [...messages];
        unreadCount = messages.filter(m => !m.is_read).length;
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdate', { detail: { count: unreadCount } }));
      } catch (err) {
        console.error(err);
      }
    }
  }

  function openCompose(replyTo: any = null) {
    activeView = 'compose';
    isReplying = !!replyTo;
    if (isReplying) {
      receiverId = replyTo.sender_id ? replyTo.sender_id.toString() : '';
      let origSub = replyTo.subject || 'No Subject';
      subject = origSub.startsWith('Re:') ? origSub : `Re: ${origSub}`;
      body = `

--- Original Message ---
${replyTo.body || ''}`;
    } else {
      receiverId = '';
      subject = '';
      body = '';
    }
  }

  async function sendMessage() {
    if (!subject || !body) {
      // @ts-ignore
      Swal.fire('Error', 'Subject and body are required', 'error');
      return;
    }
    
    if ((role === 'admin' || role === 'super_admin') && !receiverId) {
      // @ts-ignore
      Swal.fire('Error', 'Please select a recipient', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    
    let reqBody = {
      receiver_type: (role === 'admin' || role === 'super_admin') ? 'contractor' : 'admin',
      receiver_id: (role === 'admin' || role === 'super_admin') ? parseInt(receiverId) : (selectedMessage ? selectedMessage.sender_id : 1),
      subject,
      body,
      parent_id: selectedMessage ? selectedMessage.id : null
    };

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/messages', {
        method: 'POST',
        credentials: 'include',
          headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
      });
      
      const data = await res.json();
      if (data.success) {
        // @ts-ignore
        Swal.fire('Sent!', 'Your message has been sent.', 'success');
        fetchMessages('sent'); // Go to sent items
      } else {
        // @ts-ignore
        Swal.fire('Error', data.error || 'Failed to send message', 'error');
      }
    } catch (err: any) {
      // @ts-ignore
      Swal.fire('Error', err.message || 'Network error', 'error');
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

</script>


<div class="instructor-message">
    <h5 class="page-title">Messages</h5>
    <div class="row">
        <!-- Chat User List -->
        <div class="col-lg-5">
            <div class="chat-cont-left">
                <div class="chat-card mb-0 flex-fill">
                    <div class="chat-header">
                        <div class="d-flex justify-content-between mb-3">
                            <button class="btn {activeView === 'inbox' ? 'btn-primary' : 'btn-outline-primary'} btn-sm w-50 me-1" on:click={() => fetchMessages('inbox')}>Inbox</button>
                            <button class="btn {activeView === 'sent' ? 'btn-primary' : 'btn-outline-primary'} btn-sm w-50 ms-1" on:click={() => fetchMessages('sent')}>Sent</button>
                        </div>
                        <button on:click={() => openCompose()} class="btn btn-secondary w-100 btn-sm rounded-pill"><i class="isax isax-edit-2 me-2"></i>Compose</button>
                    </div>
                    <div class="chat-body chat-users-list chat-scroll">
                        {#each messages as msg}
                            <a href="#!" on:click={() => openMessage(msg)} class="d-flex align-items-center justify-content-between chat-member {selectedMessage?.id === msg.id && activeView === 'read' ? 'bg-light' : ''}">
                                <div class="d-flex align-items-center w-75">
                                    <div class="avatar avatar-lg avatar-rounded flex-shrink-0 me-2 {msg.is_read ? '' : (activeView !== 'sent' ? 'online' : '')}">
                                        <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle h-100 w-100 fs-4">
                                            {(activeView === 'sent' ? (msg.receiver_name || 'S') : (msg.sender_name || 'S')).charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div class="text-truncate">
                                        <h6 class="fs-16 fw-medium mb-1 text-truncate text-dark">{activeView === 'sent' ? (msg.receiver_name || 'System') : (msg.sender_name || 'System')}</h6>
                                        <p class="fs-14 text-gray-6 text-truncate mb-0">{msg.subject || 'No Subject'}</p>
                                    </div>
                                </div>
                                <div class="flex-shrink-0 text-end">
                                    <p class="fs-12 text-muted mb-1">{formatDate(msg.created_at)}</p>
                                    {#if !msg.is_read && activeView !== 'sent'}
                                        <div class="d-flex align-items-center justify-content-end">
                                            <i class="fa-solid fa-circle text-danger fs-10"></i>
                                        </div>
                                    {/if}
                                </div>
                            </a>
                        {/each}
                        {#if messages.length === 0}
                            <div class="text-center p-4 text-muted">
                                <p>No messages found.</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
        <!-- /Chat User List -->
        
        <!-- Chat Content -->
        <div class="col-lg-7 chat-cont-right chat-window-long">
            <div class="chat-two-card chat-window mb-0 shadow-none flex-fill h-100">
                {#if activeView === 'read' && selectedMessage}
                    <div class="border-0 p-0 position-relative">
                        <div class="msg_head">
                            <div class="d-flex bd-highlight align-items-center">
                                <div class="avatar avatar-lg avatar-rounded flex-shrink-0 me-2">
                                    <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle h-100 w-100 fs-4">
                                        {(selectedMessage.sender_name || 'S').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <h6 class="fs-16 mb-1">{selectedMessage.sender_name || 'System'}</h6>
                                    <p class="text-muted mb-0 fs-14">{selectedMessage.subject || 'No Subject'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="msg_card_body chat-scroll p-4">
                        <div class="bg-light p-3 rounded" style="white-space: pre-wrap; min-height: 200px;">
                            {selectedMessage.body || ''}
                        </div>
                    </div>
                    <div class="chat-footer border-0 pt-3 text-end">
                        <button class="btn btn-primary" on:click={() => openCompose(selectedMessage)}><i class="fa fa-reply me-2"></i> Reply</button>
                    </div>
                {:else if activeView === 'compose'}
                    <div class="border-0 p-0 position-relative">
                        <div class="msg_head">
                            <h5 class="mb-0">New Message</h5>
                        </div>
                    </div>
                    <div class="msg_card_body chat-scroll p-4">
                        <form action="#" on:submit|preventDefault={sendMessage}>
                            {#if (role === 'admin' || role === 'super_admin') && !isReplying}
                                <div class="mb-3">
                                    <label class="form-label fw-medium">To:</label>
                                    <select class="form-select" bind:value={receiverId}>
                                        <option value="">Select a Contractor to message...</option>
                                        {#each contractors as c}
                                            <option value={c.id.toString()}>{c.company_name} (#{c.id})</option>
                                        {/each}
                                    </select>
                                </div>
                            {/if}
                            {#if isReplying}
                                <div class="mb-3">
                                    <label class="form-label fw-medium">To:</label>
                                    <input type="text" class="form-control bg-light" value="{selectedMessage?.sender_name || 'Admin'}" disabled>
                                </div>
                            {/if}
                            <div class="mb-3">
                                <label class="form-label fw-medium">Subject:</label>
                                <input type="text" class="form-control" bind:value={subject} placeholder="Enter subject">
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-medium">Message:</label>
                                <textarea class="form-control" rows="8" bind:value={body} placeholder="Type your message here..."></textarea>
                            </div>
                            <div class="d-flex justify-content-end gap-2">
                                <button class="btn btn-light" type="button" on:click={() => fetchMessages('inbox')}>Discard</button>
                                <button class="btn btn-primary px-4" type="submit"><i class="fa fa-paper-plane me-2"></i> Send Message</button>
                            </div>
                        </form>
                    </div>
                {:else}
                    <div class="d-flex align-items-center justify-content-center h-100 text-muted w-100">
                        <div class="text-center p-5 mt-5">
                            <i class="isax isax-messages-3 fs-1 text-gray-4 mb-2" style="font-size: 4rem;"></i>
                            <p class="fs-18">Select a message to read or compose a new one.</p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
        <!-- /Chat Content -->
    </div>
</div>
