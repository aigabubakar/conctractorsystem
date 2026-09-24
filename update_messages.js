const fs = require('fs');

const content = `<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from './router';
  
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
    
    if (role === 'admin') {
      await fetchContractors();
    }
  });

  async function fetchMessages(type = 'inbox') {
    activeView = type;
    const token = localStorage.getItem('token');
    try {
      const endpoint = type === 'sent' ? 'http://localhost:3000/api/messages/sent' : 'http://localhost:3000/api/messages';
      const res = await fetch(endpoint, {
        headers: { 'Authorization': \`Bearer \${token}\` }
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
      const res = await fetch('http://localhost:3000/api/admin/contractors', {
        headers: { 'Authorization': \`Bearer \${token}\` }
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
        await fetch(\`http://localhost:3000/api/messages/\${msg.id}/read\`, {
          method: 'PUT',
          headers: { 'Authorization': \`Bearer \${token}\` }
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
      receiverId = replyTo.sender_id.toString();
      subject = replyTo.subject.startsWith('Re:') ? replyTo.subject : \`Re: \${replyTo.subject}\`;
      body = \`\n\n--- Original Message ---\n\${replyTo.body}\`;
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
    
    if (role === 'admin' && !receiverId) {
      // @ts-ignore
      Swal.fire('Error', 'Please select a recipient', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    
    let reqBody = {
      receiver_type: role === 'admin' ? 'contractor' : 'admin',
      receiver_id: role === 'admin' ? parseInt(receiverId) : (selectedMessage ? selectedMessage.sender_id : 1),
      subject,
      body,
      parent_id: selectedMessage ? selectedMessage.id : null
    };

    try {
      const res = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 
          'Authorization': \`Bearer \${token}\`,
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

<div class="row page-titles">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="javascript:void(0)">Email</a></li>
        <li class="breadcrumb-item active">
            <a href="javascript:void(0)">
                {#if activeView === 'inbox'}Inbox{/if}
                {#if activeView === 'sent'}Sent{/if}
                {#if activeView === 'compose'}Compose{/if}
                {#if activeView === 'read'}Read Message{/if}
            </a>
        </li>
    </ol>
</div>

<!-- row -->
<div class="row">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-body">
                <div class="email-left-box px-0 mb-3">
                    <div class="p-0">
                        <button on:click={() => openCompose()} class="btn btn-primary btn-block">Compose</button>
                    </div>
                    <div class="mail-list rounded mt-4">
                        <a href="javascript:void(0)" class="list-group-item {activeView === 'inbox' ? 'active' : ''}" on:click={() => fetchMessages('inbox')}>
                            <i class="fa fa-inbox font-18 align-middle me-2"></i> Inbox 
                            {#if unreadCount > 0}
                            <span class="badge badge-secondary badge-sm float-end">{unreadCount}</span>
                            {/if}
                        </a>
                        <a href="javascript:void(0)" class="list-group-item {activeView === 'sent' ? 'active' : ''}" on:click={() => fetchMessages('sent')}>
                            <i class="fa fa-paper-plane font-18 align-middle me-2"></i> Sent
                        </a> 
                    </div>
                </div>
                
                <div class="email-right-box ms-0 ms-sm-4 ms-sm-0">
                    
                    {#if activeView === 'inbox' || activeView === 'sent'}
                        <div role="toolbar" class="toolbar ms-1 ms-sm-0">
                            <div class="btn-group mb-1">
                                <button class="btn btn-primary light px-3" type="button" on:click={() => fetchMessages(activeView)}>
                                    <i class="ti-reload"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="email-list mt-3">
                            {#each messages as msg}
                                <div class="message">
                                    <div>
                                        <div class="d-flex message-single">
                                            <div class="ps-1 align-self-center">
                                                <!-- Custom checkbox placeholder if needed -->
                                            </div>
                                            <div class="ms-2">
                                                <button class="border-0 bg-transparent align-middle p-0">
                                                    <i class="fa fa-star {msg.is_read ? 'text-muted' : 'text-warning'}" aria-hidden="true"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <a href="javascript:void(0)" on:click={() => openMessage(msg)} class="col-mail col-mail-2 {msg.is_read ? 'text-muted' : 'font-weight-bold'}">
                                            <div class="subject">
                                                <span class="text-primary me-2">[{activeView === 'sent' ? msg.receiver_name : msg.sender_name}]</span>
                                                {msg.subject}
                                            </div>
                                            <div class="date">{formatDate(msg.created_at)}</div>
                                        </a>
                                    </div>
                                </div>
                            {:else}
                                <div class="text-center p-4 text-muted">
                                    No messages found in {activeView}.
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if activeView === 'compose'}
                        <div class="compose-content">
                            <form action="#" on:submit|preventDefault={sendMessage}>
                                {#if role === 'admin' && !isReplying}
                                    <div class="mb-3">
                                        <select class="form-control bg-transparent" bind:value={receiverId}>
                                            <option value="">Select a Contractor to message...</option>
                                            {#each contractors as c}
                                                <option value={c.id.toString()}>{c.company_name} (#{c.id})</option>
                                            {/each}
                                        </select>
                                    </div>
                                {/if}
                                {#if isReplying}
                                    <div class="mb-3">
                                        <input type="text" class="form-control bg-transparent" value="Replying to: {selectedMessage?.sender_name || 'Admin'}" disabled>
                                    </div>
                                {/if}
                                <div class="mb-3">
                                    <input type="text" class="form-control bg-transparent" bind:value={subject} placeholder=" Subject:">
                                </div>
                                <div class="mb-3">
                                    <textarea class="textarea_editor form-control bg-transparent" rows="15" bind:value={body} placeholder="Enter text ..."></textarea>
                                </div>
                                <div class="text-start mt-4 mb-3">
                                    <button class="btn btn-primary btn-sl-sm me-2" type="submit">
                                        <span class="me-2"><i class="fa fa-paper-plane"></i></span>Send
                                    </button>
                                    <button class="btn btn-danger light btn-sl-sm" type="button" on:click={() => fetchMessages('inbox')}>
                                        <span class="me-2"><i class="fa fa-times"></i></span>Discard
                                    </button>
                                </div>
                            </form>
                        </div>
                    {/if}
                    
                    {#if activeView === 'read'}
                        <div class="read-content">
                            <div class="media pt-3">
                                <div class="media-body me-2">
                                    <h5 class="text-primary mb-0 mt-1">{selectedMessage.subject}</h5>
                                    <p class="mb-0">{formatDate(selectedMessage.created_at)}</p>
                                </div>
                                <button href="javascript:void(0)" on:click={() => openCompose(selectedMessage)} class="btn btn-primary px-3 light"><i class="fa fa-reply"></i> </button>
                            </div>
                            <hr>
                            <div class="media mb-4 mt-1">
                                <div class="media-body">
                                    {#if selectedMessage.sender_type}
                                    <h4 class="m-0 text-primary">{selectedMessage.sender_name}</h4>
                                    {:else}
                                    <h4 class="m-0 text-primary">{selectedMessage.receiver_name} (To)</h4>
                                    {/if}
                                </div>
                            </div>
                            <h5 class="mb-4">Message Body</h5>
                            <p class="mb-2" style="white-space: pre-wrap;">{selectedMessage.body}</p>
                            <hr>
                        </div>
                        <div class="text-end">
                            <button class="btn btn-primary" on:click={() => openCompose(selectedMessage)} type="button">Reply</button>
                        </div>
                    {/if}

                </div>
            </div>
        </div>
    </div>
</div>
`;

fs.writeFileSync('./frontend/src/Messages.svelte', content);
console.log('Messages updated');
