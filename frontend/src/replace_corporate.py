import re

with open(r'c:\Users\BTC\Desktop\contractorregistration\frontend\src\VerificationCenter.svelte', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = r'<!-- Corporate Details -->'
end_marker = r'  </div>\n</div>\n{/if}'

replacement = """<!-- Corporate Details -->
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
      </div>
    </div>
  </div>
{/if}"""

import re
new_content = re.sub(start_marker + r'.*?' + end_marker, replacement, content, flags=re.DOTALL)

with open(r'c:\Users\BTC\Desktop\contractorregistration\frontend\src\VerificationCenter.svelte', 'w', encoding='utf-8') as f:
    f.write(new_content)
