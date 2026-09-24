<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import Swal from 'sweetalert2';

  let profile: any = null;
  let loading = true;
  let error = '';
  
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

  let uploadingDocId = '';
  let activeFileInput: HTMLInputElement;

  let isCorporate = false;
  let corporateDetails: any = {
    reg_no: '', reg_date: '', reg_place: '', paid_up_capital: '',
    total_assets: '', date_of_incorporation: '', chairman_name: '',
    chairman_address: '', chairman_phone: '',
    secretary_name: '', secretary_address: '', secretary_phone: '', ceo_name: '',
    directors: [], principal_officers: [], past_contracts: [], abandoned_projects: [], other_business_lines: [], equipment: [],
    declaration_accepted: false
  };
  let savingCorporate = false;
  let isCorporateFilled = false;

  function addArrayItem(key: string) {
    if (key === 'directors') corporateDetails.directors = [...corporateDetails.directors, { name: '', qualifications: '', address_phone: '', age: '' }];
    if (key === 'principal_officers') corporateDetails.principal_officers = [...corporateDetails.principal_officers, { name: '', position: '', qualifications: '', experience: '' }];
    if (key === 'past_contracts') corporateDetails.past_contracts = [...corporateDetails.past_contracts, { project: '', value: '', client: '', start: '', end: '' }];
    if (key === 'abandoned_projects') corporateDetails.abandoned_projects = [...corporateDetails.abandoned_projects, { project: '', value: '', client: '', start: '', reason: '' }];
    if (key === 'other_business_lines') corporateDetails.other_business_lines = [...corporateDetails.other_business_lines, { business: '', turnover: '', branches: '', remarks: '' }];
    if (key === 'equipment') corporateDetails.equipment = [...corporateDetails.equipment, { type: '', number: '', value: '', location: '' }];
  }

  function removeArrayItem(key: string, index: number) {
    corporateDetails[key] = corporateDetails[key].filter((_: any, i: number) => i !== index);
  }

  function isDocUploaded(id: string) {
    if (!profile || !profile.documents) return false;
    return profile.documents.some((d: any) => d.document_type === id);
  }

  function getDocPath(id: string) {
    if (!profile || !profile.documents) return '';
    const doc = profile.documents.find((d: any) => d.document_type === id);
    return doc ? doc.file_path : '';
  }

  function triggerUpload(docId: string) {
    uploadingDocId = docId;
    activeFileInput.click();
  }

  async function handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) {
      uploadingDocId = '';
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', uploadingDocId);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/upload-document', {
        method: 'POST',
        credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const profileRes = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/me', {
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileRes.ok) {
            profile = profileData.data;
        }
        Swal.fire({
          title: 'Success!',
          text: 'Document uploaded successfully.',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      } else {
        Swal.fire({
          title: 'Upload Failed',
          text: data.error || 'There was a problem uploading your document.',
          icon: 'error',
          confirmButtonColor: '#4f46e5'
        });
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Network error during upload',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      uploadingDocId = '';
      if (activeFileInput) activeFileInput.value = '';
    }
  }

  async function saveCorporateDetails() {
    if (!corporateDetails.reg_no || !corporateDetails.reg_date || !corporateDetails.reg_place) {
        Swal.fire({
          title: 'Missing Information',
          text: 'Please fill in the basic Corporate Information (Registration Number, Date, and Place) before saving.',
          icon: 'warning',
          confirmButtonColor: '#4f46e5'
        });
        return;
    }
    if (!corporateDetails.declaration_accepted) {
        Swal.fire({
          title: 'Declaration Required',
          text: 'You must accept the Declaration and Undertaking at the bottom to save.',
          icon: 'info',
          confirmButtonColor: '#4f46e5'
        });
        return;
    }
    savingCorporate = true;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/corporate-details', {
        method: 'POST',
        credentials: 'include',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(corporateDetails)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        isCorporateFilled = true;
        Swal.fire({
          title: 'Saved!',
          text: 'Corporate details saved successfully!',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      } else {
        Swal.fire({
          title: 'Failed',
          text: data.error || 'Failed to save details',
          icon: 'error',
          confirmButtonColor: '#4f46e5'
        });
      }
    } catch(err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Network error',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      savingCorporate = false;
    }
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
        if (profile.corporate_details) {
            corporateDetails = {
                reg_no: profile.corporate_details.reg_no || '',
                reg_date: profile.corporate_details.reg_date || '',
                reg_place: profile.corporate_details.reg_place || '',
                paid_up_capital: profile.corporate_details.paid_up_capital || '',
                total_assets: profile.corporate_details.total_assets || '',
                date_of_incorporation: profile.corporate_details.date_of_incorporation || '',
                chairman_name: profile.corporate_details.chairman_name || '',
                chairman_address: profile.corporate_details.chairman_address || '',
                chairman_phone: profile.corporate_details.chairman_phone || '',
                secretary_name: profile.corporate_details.secretary_name || '',
                secretary_address: profile.corporate_details.secretary_address || '',
                secretary_phone: profile.corporate_details.secretary_phone || '',
                ceo_name: profile.corporate_details.ceo_name || '',
                directors: profile.corporate_details.directors || [],
                principal_officers: profile.corporate_details.principal_officers || [],
                past_contracts: profile.corporate_details.past_contracts || [],
                abandoned_projects: profile.corporate_details.abandoned_projects || [],
                other_business_lines: profile.corporate_details.other_business_lines || [],
                equipment: profile.corporate_details.equipment || [],
                declaration_accepted: profile.corporate_details.declaration_accepted === 1
            };
            
            if (typeof corporateDetails.directors === 'string') corporateDetails.directors = JSON.parse(corporateDetails.directors);
            if (typeof corporateDetails.principal_officers === 'string') corporateDetails.principal_officers = JSON.parse(corporateDetails.principal_officers);
            if (typeof corporateDetails.past_contracts === 'string') corporateDetails.past_contracts = JSON.parse(corporateDetails.past_contracts);
            if (typeof corporateDetails.abandoned_projects === 'string') corporateDetails.abandoned_projects = JSON.parse(corporateDetails.abandoned_projects);
            if (typeof corporateDetails.other_business_lines === 'string') corporateDetails.other_business_lines = JSON.parse(corporateDetails.other_business_lines);
            if (typeof corporateDetails.equipment === 'string') corporateDetails.equipment = JSON.parse(corporateDetails.equipment);

            isCorporate = true;
            isCorporateFilled = true;
        }
      } else {
        error = data.error || 'Failed to load profile';
      }
    } catch (err: any) {
      error = err.message || 'Network error';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="flex h-full w-full items-center justify-center p-10">
    <div class="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent dark:border-navy-400 dark:border-t-transparent"></div>
  </div>
{:else if error}
  <div class="p-10">
    <div class="rounded-lg bg-error/10 p-5 text-error">
      <h3 class="text-lg font-semibold">Error</h3>
      <p>{error}</p>
    </div>
  </div>
{:else if profile}
  <div class="p-6 md:p-10 max-w-7xl mx-auto w-full">
    <!-- Premium Page Banner -->
    <div class="card bg-primary mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap">
          <div class="mb-3 mb-sm-0">
            <h4 class="fs-24 font-w700 text-white">Verification Center</h4>
            <span class="text-white">Upload your required documents and fill out corporate details to complete your registration portfolio. All documents must be in PDF format.</span>
          </div>
          <div class="d-flex align-items-center">
             <button on:click={() => navigate('/contractor/dashboard')} class="btn btn-light text-primary font-w600"><i class="fas fa-arrow-left me-2"></i>Back to Dashboard</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Corporate Details -->
    <div class="card mb-5">
      <div class="card-header border-0 pb-0 flex-wrap">
        <div class="mb-3">
          <h4 class="card-title">Corporate Details</h4>
          <p class="mb-0 text-muted">If application is on behalf of a Limited or Public liability company, State or Partnership, Government institution etc.</p>
        </div>
        
        <div class="form-check form-switch toggle-switch text-end me-4 mb-2">
          <input type="checkbox" class="form-check-input cursor-pointer" id="customSwitch11" bind:checked={isCorporate}>
          <label class="form-check-label cursor-pointer" for="customSwitch11">Enable</label>
        </div>
      </div>

      {#if isCorporate}
        <div class="card-body">
          <div class="row">
            <!-- Basic Corporate Info -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header">
                  <h5 class="card-title"><span class="badge badge-primary light me-2">I</span> Basic Information</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Corporate Reg. No</label>
                      <input bind:value={corporateDetails.reg_no} type="text" class="form-control" placeholder="Registration Number" />
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Registration Date</label>
                      <input bind:value={corporateDetails.reg_date} type="date" class="form-control" />
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Registration Place</label>
                      <input bind:value={corporateDetails.reg_place} type="text" class="form-control" placeholder="Place" />
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Paid-up Share Capital (#)</label>
                      <input bind:value={corporateDetails.paid_up_capital} type="text" class="form-control" placeholder="Amount" />
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Total Assets (#)</label>
                      <input bind:value={corporateDetails.total_assets} type="text" class="form-control" placeholder="Amount" />
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Date of Incorporation</label>
                      <input bind:value={corporateDetails.date_of_incorporation} type="date" class="form-control" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Key Personnel -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header">
                  <h5 class="card-title"><span class="badge badge-info light me-2">II</span> Key Personnel</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <!-- Chairman -->
                    <div class="col-lg-6 mb-4">
                      <h6 class="font-w600 mb-3">Chairman</h6>
                      <div class="mb-3">
                        <label class="form-label">Full Name</label>
                        <input bind:value={corporateDetails.chairman_name} type="text" class="form-control" />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Phone Number</label>
                        <input bind:value={corporateDetails.chairman_phone} type="text" class="form-control" />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Contact Address</label>
                        <textarea bind:value={corporateDetails.chairman_address} rows="2" class="form-control"></textarea>
                      </div>
                    </div>
                    <!-- Secretary -->
                    <div class="col-lg-6 mb-4">
                      <h6 class="font-w600 mb-3">Secretary</h6>
                      <div class="mb-3">
                        <label class="form-label">Full Name</label>
                        <input bind:value={corporateDetails.secretary_name} type="text" class="form-control" />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Phone Number</label>
                        <input bind:value={corporateDetails.secretary_phone} type="text" class="form-control" />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Contact Address</label>
                        <textarea bind:value={corporateDetails.secretary_address} rows="2" class="form-control"></textarea>
                      </div>
                    </div>
                    <!-- CEO -->
                    <div class="col-lg-12 border-top pt-4">
                      <div class="row">
                         <div class="col-md-6">
                            <label class="form-label">Name of Chief Executive Officer</label>
                            <input bind:value={corporateDetails.ceo_name} type="text" class="form-control" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Directors -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header d-flex justify-content-between flex-wrap">
                  <h5 class="card-title"><span class="badge badge-primary light me-2">III</span> Directors of the Company</h5>
                  <button on:click={() => addArrayItem('directors')} class="btn btn-outline-primary btn-sm"><i class="fas fa-plus me-2"></i>Add Director</button>
                </div>
                <div class="card-body">
                  {#if corporateDetails.directors.length === 0}
                     <p class="text-muted fst-italic">No directors added.</p>
                  {/if}
                  {#each corporateDetails.directors as director, i}
                    <div class="row align-items-end mb-3 pb-3 border-bottom">
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Name</label>
                        <input bind:value={director.name} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Qualification(s)</label>
                        <input bind:value={director.qualifications} type="text" class="form-control" />
                      </div>
                      <div class="col-md-4 mb-2">
                        <label class="form-label">Address & Phone</label>
                        <input bind:value={director.address_phone} type="text" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <label class="form-label">Age</label>
                        <input bind:value={director.age} type="number" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <button on:click={() => removeArrayItem('directors', i)} class="btn btn-danger btn-sm w-100"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Principal Officers -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header d-flex justify-content-between flex-wrap">
                  <h5 class="card-title"><span class="badge badge-success light me-2">IV</span> Principal Officers</h5>
                  <button on:click={() => addArrayItem('principal_officers')} class="btn btn-outline-success btn-sm"><i class="fas fa-plus me-2"></i>Add Officer</button>
                </div>
                <div class="card-body">
                  {#if corporateDetails.principal_officers.length === 0}
                     <p class="text-muted fst-italic">No officers added.</p>
                  {/if}
                  {#each corporateDetails.principal_officers as officer, i}
                    <div class="row align-items-end mb-3 pb-3 border-bottom">
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Name</label>
                        <input bind:value={officer.name} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Position</label>
                        <input bind:value={officer.position} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Qualification(s)</label>
                        <input bind:value={officer.qualifications} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Years of Exp.</label>
                        <input bind:value={officer.experience} type="number" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <button on:click={() => removeArrayItem('principal_officers', i)} class="btn btn-danger btn-sm w-100"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Past Contracts -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header d-flex justify-content-between flex-wrap">
                  <h5 class="card-title"><span class="badge badge-warning light text-white me-2">V</span> Past Contracts</h5>
                  <button on:click={() => addArrayItem('past_contracts')} class="btn btn-outline-warning btn-sm"><i class="fas fa-plus me-2"></i>Add Contract</button>
                </div>
                <div class="card-body">
                  {#if corporateDetails.past_contracts.length === 0}
                     <p class="text-muted fst-italic">No past contracts added.</p>
                  {/if}
                  {#each corporateDetails.past_contracts as contract, i}
                    <div class="row align-items-end mb-3 pb-3 border-bottom">
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Types & Location</label>
                        <input bind:value={contract.project} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Value (#)</label>
                        <input bind:value={contract.value} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Client Name & Address</label>
                        <input bind:value={contract.client} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Commenced</label>
                        <input bind:value={contract.start} type="date" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <label class="form-label">Completed</label>
                        <input bind:value={contract.end} type="date" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <button on:click={() => removeArrayItem('past_contracts', i)} class="btn btn-danger btn-sm w-100"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Abandoned Projects -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header d-flex justify-content-between flex-wrap">
                  <h5 class="card-title"><span class="badge badge-danger light me-2">VI</span> Abandoned Projects</h5>
                  <button on:click={() => addArrayItem('abandoned_projects')} class="btn btn-outline-danger btn-sm"><i class="fas fa-plus me-2"></i>Add Project</button>
                </div>
                <div class="card-body">
                  {#if corporateDetails.abandoned_projects.length === 0}
                     <p class="text-muted fst-italic">No abandoned projects added.</p>
                  {/if}
                  {#each corporateDetails.abandoned_projects as project, i}
                    <div class="row align-items-end mb-3 pb-3 border-bottom">
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Types & Location</label>
                        <input bind:value={project.project} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Value (#)</label>
                        <input bind:value={project.value} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Client Details</label>
                        <input bind:value={project.client} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Commenced</label>
                        <input bind:value={project.start} type="date" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Reason</label>
                        <input bind:value={project.reason} type="text" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <button on:click={() => removeArrayItem('abandoned_projects', i)} class="btn btn-danger btn-sm w-100"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Other Business Lines -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header d-flex justify-content-between flex-wrap">
                  <h5 class="card-title"><span class="badge badge-info light me-2">VII</span> Other Business Lines</h5>
                  <button on:click={() => addArrayItem('other_business_lines')} class="btn btn-outline-info btn-sm"><i class="fas fa-plus me-2"></i>Add Business</button>
                </div>
                <div class="card-body">
                  {#if corporateDetails.other_business_lines.length === 0}
                     <p class="text-muted fst-italic">No other business lines added.</p>
                  {/if}
                  {#each corporateDetails.other_business_lines as business, i}
                    <div class="row align-items-end mb-3 pb-3 border-bottom">
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Type of business</label>
                        <input bind:value={business.business} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Annual turnover</label>
                        <input bind:value={business.turnover} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Branches / Locations</label>
                        <input bind:value={business.branches} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Remarks</label>
                        <input bind:value={business.remarks} type="text" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <button on:click={() => removeArrayItem('other_business_lines', i)} class="btn btn-danger btn-sm w-100"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Equipment -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                <div class="card-header d-flex justify-content-between flex-wrap">
                  <h5 class="card-title"><span class="badge badge-primary light me-2">VIII</span> Equipment List</h5>
                  <button on:click={() => addArrayItem('equipment')} class="btn btn-outline-primary btn-sm"><i class="fas fa-plus me-2"></i>Add Equipment</button>
                </div>
                <div class="card-body">
                  {#if corporateDetails.equipment.length === 0}
                     <p class="text-muted fst-italic">No equipment added.</p>
                  {/if}
                  {#each corporateDetails.equipment as eq, i}
                    <div class="row align-items-end mb-3 pb-3 border-bottom">
                      <div class="col-md-4 mb-2">
                        <label class="form-label">Type</label>
                        <input bind:value={eq.type} type="text" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Number</label>
                        <input bind:value={eq.number} type="number" class="form-control" />
                      </div>
                      <div class="col-md-2 mb-2">
                        <label class="form-label">Present Value</label>
                        <input bind:value={eq.value} type="text" class="form-control" />
                      </div>
                      <div class="col-md-3 mb-2">
                        <label class="form-label">Location(s)</label>
                        <input bind:value={eq.location} type="text" class="form-control" />
                      </div>
                      <div class="col-md-1 mb-2">
                        <button on:click={() => removeArrayItem('equipment', i)} class="btn btn-danger btn-sm w-100"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Renewal Fees Information -->
            <div class="col-xl-12 mb-4">
              <div class="alert alert-primary alert-dismissible fade show">
                 <h4 class="alert-heading font-w600">Renewal Information</h4>
                 <p class="mb-3">The Registration Would Be Renewed Every Two Years with Renewed Fees Stated therein. These Are Subject to Review From Time to Time.</p>
                 <div class="table-responsive">
                   <table class="table table-bordered table-sm table-primary text-black" style="max-width: 400px; background: transparent;">
                      <thead>
                         <tr>
                            <th>Category</th>
                            <th>Renewal Fees</th>
                         </tr>
                      </thead>
                      <tbody>
                         <tr><td class="font-w600">A</td><td>#150,000</td></tr>
                         <tr><td class="font-w600">B</td><td>#130,000</td></tr>
                         <tr><td class="font-w600">C</td><td>#100,000</td></tr>
                         <tr><td class="font-w600">D</td><td>#75,000</td></tr>
                         <tr><td class="font-w600">E</td><td>#50,000</td></tr>
                      </tbody>
                   </table>
                 </div>
              </div>
            </div>

            <!-- Declaration -->
            <div class="col-xl-12 mb-4">
              <div class="card shadow-sm border border-light h-100">
                 <div class="card-body">
                   <h4 class="card-title text-primary mb-4"><i class="fas fa-file-signature me-2"></i>Declaration and Undertaking</h4>
                   
                   <p class="font-w600 text-black">I declare that:</p>
                   <ol class="text-black mb-4 ps-3" style="line-height: 1.8;">
                      <li>The information given above is correct and true to the best of my knowledge;</li>
                      <li>I have not been barred/blacklisted by any Federal/State or Local Government Agency;</li>
                      <li>If any information is found to be false, the Board reserves the right to reject my application and cancel my registration;</li>
                      <li>I am willing to abide by the rules and regulations governing contractors and suppliers in the state;</li>
                      <li>The registration fee is non-refundable.</li>
                   </ol>
                   <p class="fst-italic text-danger mb-4">This declaration shall be binding upon you and, where applicable, your organization.</p>
                   
                   <div class="form-check custom-checkbox mb-4">
                      <input type="checkbox" class="form-check-input" id="customCheckBox1" bind:checked={corporateDetails.declaration_accepted}>
                      <label class="form-check-label font-w600 text-black" for="customCheckBox1">I have read, understood, and accept the Declaration and Undertaking.</label>
                   </div>
                 </div>
              </div>
            </div>
            
            <div class="col-xl-12">
              <div class="d-flex justify-content-end">
                <button 
                  on:click={saveCorporateDetails}
                  disabled={savingCorporate}
                  class="btn btn-primary btn-lg"
                >
                  {#if savingCorporate}
                    <i class="fas fa-spinner fa-spin me-2"></i> Saving Details...
                  {:else}
                    Save Corporate Details <i class="fas fa-arrow-right ms-2"></i>
                  {/if}
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

    {#if isCorporateFilled}
      <!-- Hidden global file input for PDF only -->
      <input type="file" accept=".pdf" class="hidden" bind:this={activeFileInput} on:change={handleFileUpload} />
  
      <!-- Verification Center (11 Documents) -->
      <div class="card mb-4">
        <div class="card-header">
          <h4 class="card-title">Required Documents</h4>
        </div>
        <div class="card-body">
          <p class="mb-4">
            The original of the following documents shall be made available to the appropriate officer in the Procurement Unit for sighting and photocopy submitted before clearance. <strong>PDF format only.</strong>
          </p>
  
          <div class="row">
            {#each requiredDocs as doc}
              <div class="col-xl-3 col-lg-4 col-sm-6 mb-4">
                <div class="card h-100 border {isDocUploaded(doc.id) ? 'border-success' : 'border-light'} shadow-sm">
                  <div class="card-body p-4 d-flex flex-column justify-content-between">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                      <h5 class="fs-16 font-w600 mb-0">{doc.title}</h5>
                      {#if isDocUploaded(doc.id)}
                        <span class="badge badge-success light"><i class="fas fa-check"></i></span>
                      {:else}
                        <span class="badge badge-warning light"><i class="fas fa-exclamation"></i></span>
                      {/if}
                    </div>
                    
                    <div class="mt-auto pt-3 border-top {isDocUploaded(doc.id) ? 'border-success' : ''}">
                      {#if isDocUploaded(doc.id)}
                        <div class="d-flex gap-2">
                          <a href={`${import.meta.env.VITE_API_URL}${getDocPath(doc.id)}`} target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm flex-grow-1">
                            View
                          </a>
                          <button on:click={() => triggerUpload(doc.id)} class="btn btn-primary btn-sm flex-grow-1">
                            {#if uploadingDocId === doc.id}
                              <i class="fas fa-spinner fa-spin"></i>
                            {:else}
                              Update
                            {/if}
                          </button>
                        </div>
                      {:else}
                        <button 
                          on:click={() => triggerUpload(doc.id)}
                          disabled={uploadingDocId === doc.id}
                          class="btn btn-primary btn-sm w-100"
                        >
                          {#if uploadingDocId === doc.id}
                            <i class="fas fa-spinner fa-spin me-2"></i> Uploading...
                          {:else}
                            <i class="fas fa-upload me-2"></i> Upload PDF
                          {/if}
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
  
    {:else}
      <div class="alert alert-warning p-4 mb-4">
        <h5 class="text-warning fw-bold mb-2"><i class="isax isax-warning-2 me-2"></i>Action Required</h5>
        <p class="mb-0">You must completely fill out and save your <strong>Corporate Details</strong> above before you can upload any documents. This is strictly enforced.</p>
      </div>
    {/if}

    </div>
  </div>
{/if}
