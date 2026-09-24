<script lang="ts">

  import { onMount } from 'svelte';

  import { navigate } from 'svelte-routing';

  import { Toast, showAlert } from './utils/alert';

  import { loadRemitaScript, processRemitaPayment } from './utils/payment';

  import NewHeader from './NewHeader.svelte';

  import NewFooter from './NewFooter.svelte';



  let companyName = '';

  let email = '';

  let phone = '';

  let password = '';

  let isProcessing = false;



  let step = 1;

  let token = '';

  let locationAddress = '';

  let postalAddress = '';

  let category = 'Construction';

  let cacNumber = '';

  let tin = '';

  let registrationFee = 10000;

  let categoriesData = [];



  $: categoryFee = categoriesData.find(c => c.name === category)?.registration_fee || 0;



  onMount(async () => {

    loadRemitaScript();

    

    try {

      const [settingsRes, catRes] = await Promise.all([

        fetch(import.meta.env.VITE_API_URL + '/api/settings'),

        fetch(import.meta.env.VITE_API_URL + '/api/categories')

      ]);

      const settingsData = await settingsRes.json();

      const catData = await catRes.json();



      if (settingsData.success && settingsData.data.registration_fee) {

        registrationFee = parseFloat(settingsData.data.registration_fee);

      }

      if (catData.success) {

        categoriesData = catData.data;

        if (categoriesData.length > 0) {

          category = categoriesData[0].name;

        }

      }

    } catch (err) {

      console.error("Failed to fetch config:", err);

    }

  });



  async function handlePayment() {

    if (companyName.trim().length < 3) {

      Toast.fire({ icon: 'error', title: 'Company Name must be at least 3 characters' });

      return;

    }

    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {

      Toast.fire({ icon: 'error', title: 'Please enter a valid email address' });

      return;

    }

    

    const phoneRegex = /^[0-9+\s-]{10,15}$/;

    if (!phoneRegex.test(phone.trim())) {

      Toast.fire({ icon: 'error', title: 'Please enter a valid phone number (10-15 digits)' });

      return;

    }



    try {

      isProcessing = true;

      Toast.fire({ icon: 'info', title: 'Initiating payment...' });



      const initRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/initiate', {

        method: 'POST',

        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ name: companyName, email, phone, payment_type: 'registration' })

      });

      const initData = await initRes.json();

      

      if (!initData.success) {

        throw new Error(initData.error || "Failed to initialize payment.");

      }



      const { transactionId, rrr, amount } = initData.data;



      processRemitaPayment({

        transactionId: transactionId,

        amount: amount || registrationFee,

        email: email,

        firstName: companyName,

        lastName: "Registration",

        phoneNumber: phone,

        narration: "Form Purchase Fee",

        onSuccess: async (response) => {

            console.log("Remita Payment Successful", response);

            Toast.fire({ icon: 'info', title: 'Verifying payment...' });

            

            try {

              const verifyRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/verify', {

                method: 'POST',

                credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ rrr: rrr })

              });

              const verifyData = await verifyRes.json();

              if (!verifyData.success) throw new Error("Payment Verification Failed");

              

              const regRes = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/register', {

                method: 'POST',

                credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({

                  rrr: rrr,

                  company_name: companyName,

                  email: email,

                  telephone: phone,

                  location_address: 'Pending Completion',

                  postal_address: 'Pending Completion',

                  category: 'Pending Completion'

                })

              });



              const regData = await regRes.json();

              isProcessing = false;



              if (regRes.ok && regData.success) {

                Toast.fire({ icon: 'success', title: 'Payment Successful! Please complete your profile.' });

                token = regData.token;

                localStorage.setItem('contractor_token', token);

                step = 2;

              } else {

                showAlert("Registration Failed", regData.error || "Unknown error occurred.", "error");

              }

            } catch (err: any) {

              isProcessing = false;

              showAlert("Registration Error", err.message || "Something went wrong.", "error");

            }

        },

        onError: (response) => {

            console.log("Remita Payment Error", response);

            isProcessing = false;

            showAlert("Payment Failed", "Payment failed or was cancelled.", "error");

        },

        onClose: () => {

            console.log("Remita Modal Closed");

            isProcessing = false;

        }

      });

    } catch (err: any) {

      isProcessing = false;

      showAlert("Error", err.message || "Failed to connect to payment server. Please try again.", "error");

    }

  }



  async function skipPayment() {

    if (companyName.trim().length < 3) {

      Toast.fire({ icon: 'error', title: 'Company Name must be at least 3 characters' });

      return;

    }

    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {

      Toast.fire({ icon: 'error', title: 'Please enter a valid email address' });

      return;

    }

    

    const phoneRegex = /^[0-9+\s-]{10,15}$/;

    if (!phoneRegex.test(phone.trim())) {

      Toast.fire({ icon: 'error', title: 'Please enter a valid phone number (10-15 digits)' });

      return;

    }



    try {

      isProcessing = true;

      Toast.fire({ icon: 'info', title: 'Skipping payment (Dev Mode)...' });



      const initRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/initiate', {

        method: 'POST',

        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ name: companyName, email, phone, payment_type: 'registration' })

      });

      const initData = await initRes.json();

      if (!initData.success) throw new Error(initData.error || "Failed to initialize payment.");



      const { rrr } = initData.data;



      const verifyRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/verify', {

        method: 'POST',

        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ rrr: rrr })

      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) throw new Error("Payment Verification Failed");

      

      const regRes = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/register', {

        method: 'POST',

        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          rrr: rrr,

          company_name: companyName,

          email: email,

          telephone: phone,

          location_address: 'Pending Completion',

          postal_address: 'Pending Completion',

          category: 'Pending Completion'

        })

      });



      const regData = await regRes.json();

      isProcessing = false;



      if (regRes.ok && regData.success) {

        Toast.fire({ icon: 'success', title: 'Payment Successful! Please complete your profile.' });

        token = regData.token;

        localStorage.setItem('contractor_token', token);

        step = 2;

      } else {

        showAlert("Registration Failed", regData.error || "Unknown error occurred.", "error");

      }

    } catch (err: any) {

      isProcessing = false;

      showAlert("Error", err.message || "Failed to connect to server.", "error");

    }

  }



  async function handleCategoryPayment() {

    if (!locationAddress || !postalAddress || !cacNumber || !tin) {

      Toast.fire({ icon: 'error', title: 'Please fill in all required fields.' });

      return;

    }

    if (password.length < 6) {

      Toast.fire({ icon: 'error', title: 'Password must be at least 6 characters' });

      return;

    }



    try {

      isProcessing = true;

      Toast.fire({ icon: 'info', title: 'Initializing payment...' });



      const initRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/initiate', {

        method: 'POST',

        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          name: companyName,

          email: email,

          phone: phone,

          payment_type: 'category',

          category_name: category

        })

      });



      const initData = await initRes.json();

      if (!initRes.ok || !initData.success) {

        throw new Error(initData.error || "Failed to initialize payment.");

      }



      const { transactionId, rrr, amount } = initData.data;



      processRemitaPayment({

        transactionId: transactionId,

        amount: amount || categoryFee,

        email: email,

        firstName: companyName,

        lastName: "Category Registration",

        onSuccess: async function (response) {

          try {

            isProcessing = true;

            Toast.fire({ icon: 'info', title: 'Verifying payment...' });



            const verifyRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/verify', {

              method: 'POST',

              credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({ rrr: rrr })

            });

            const verifyData = await verifyRes.json();

            

            if (!verifyRes.ok || !verifyData.success) {

               throw new Error(verifyData.error || "Payment verification failed.");

            }



            const token = localStorage.getItem('contractor_token');

            const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/profile', {

              method: 'PUT',

              credentials: 'include',
          headers: { 

                'Content-Type': 'application/json',

                'Authorization': `Bearer ${token}`

              },

              body: JSON.stringify({

                location_address: locationAddress,

                postal_address: postalAddress,

                category: category,

                cac_number: cacNumber,

                tin: tin,

                password: password,

                category_rrr: rrr

              })

            });

            const data = await res.json();

            isProcessing = false;

            if (res.ok && data.success) {

              Toast.fire({ icon: 'success', title: 'Registration Fully Complete! Please sign in.' });

              navigate('/login');

            } else {

              showAlert("Update Failed", data.error || "Failed to update profile.", "error");

            }



          } catch (err: any) {

            isProcessing = false;

            showAlert("Verification Error", err.message || "Failed to complete registration.", "error");

          }

        },

        onError: function (response) {

          isProcessing = false;

          showAlert("Payment Failed", "Transaction was not successful.", "error");

        },

        onClose: function () {

          isProcessing = false;

          console.log("Payment widget closed.");

        }

      });

    } catch (err: any) {

      isProcessing = false;

      showAlert("Error", err.message || "Failed to connect to server.", "error");

    }

  }



  async function skipCategoryPayment() {

    if (!locationAddress || !postalAddress || !cacNumber || !tin) {

      Toast.fire({ icon: 'error', title: 'Please fill in all required fields.' });

      return;

    }

    if (password.length < 6) {

      Toast.fire({ icon: 'error', title: 'Password must be at least 6 characters' });

      return;

    }



    try {

      isProcessing = true;

      Toast.fire({ icon: 'info', title: 'Bypassing category payment...' });



      const bypassRes = await fetch(import.meta.env.VITE_API_URL + '/api/remita/bypass', {

        method: 'POST',

        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ 

          name: companyName, 

          email: email, 

          phone: phone,

          payment_type: 'category',

          amount: categoryFee

        })

      });

      const bypassData = await bypassRes.json();

      

      if (!bypassRes.ok || !bypassData.success) {

         throw new Error(bypassData.error || "Failed to bypass payment.");

      }



      const { rrr } = bypassData.data;



      const token = localStorage.getItem('contractor_token');

      const res = await fetch(import.meta.env.VITE_API_URL + '/api/contractors/profile', {

        method: 'PUT',

        credentials: 'include',
          headers: { 

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`

        },

        body: JSON.stringify({

          location_address: locationAddress,

          postal_address: postalAddress,

          category: category,

          cac_number: cacNumber,

          tin: tin,

          password: password,

          category_rrr: rrr

        })

      });

      const data = await res.json();

      isProcessing = false;

      if (res.ok && data.success) {

        Toast.fire({ icon: 'success', title: 'Registration Fully Complete! Please sign in.' });

        navigate('/login');

      } else {

        showAlert("Update Failed", data.error || "Failed to update profile.", "error");

      }

    } catch (err: any) {

      isProcessing = false;

      showAlert("Error", err.message || "Failed to connect to server.", "error");

    }

  }

</script>



<div class="main-wrapper">

  <NewHeader />



  <div class="page-content" style="background-color: #f5f6fa; padding: 60px 0;">

    <div class="container">

      <div class="row justify-content-center">

        <div class="col-lg-12">

          <div class="card shadow-lg border-0 overflow-hidden" style="border-radius: 15px;">

            <div class="row g-0">

              

              <!-- Left Side Info -->

              <div class="col-lg-6 d-none d-lg-flex bg-white align-items-center justify-content-center p-5 border-end">

                <div class="w-100 text-center">

                  <img src="/images/app-logo.png" alt="logo" class="mb-4" style="height: 100px;" />

                  <h3 class="fw-bold mb-4">EDO STATE UNIVERSITY REGISTRATION OF CONTRACTORS</h3>

                  

                  {#if step === 1}

                    <div class="bg-light p-4 rounded text-start">

                      <h5 class="text-primary mb-3">Instructions for Contractors:</h5>

                      <ul class="list-unstyled mb-0">

                        <li class="mb-3 d-flex"><i class="isax isax-tick-circle text-success fs-20 me-2"></i> <span>Pay a non-refundable fee of {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(registrationFee)} for the purchase of the form via Remita.</span></li>

                        <li class="mb-3 d-flex"><i class="isax isax-tick-circle text-success fs-20 me-2"></i> <span>Upon successful payment, complete your proper company registration.</span></li>

                        <li class="d-flex"><i class="isax isax-tick-circle text-success fs-20 me-2"></i> <span>Wait for administrative approval before you can access contract bids.</span></li>

                      </ul>

                    </div>

                  {:else}

                    <div class="text-start mt-4">

                      <h4 class="text-primary mb-3"><i class="isax isax-category me-2"></i> CATEGORIES OF REGISTRATION</h4>

                      <p class="mb-4 text-muted">You will be requested to choose at least a Category as shown in the table below, you are required to register for your choice category and make payment accordingly via remita.</p>

                      <div class="table-responsive">

                        <table class="table table-bordered table-sm text-black">

                          <thead class="table-light">

                            <tr>

                              <th>CATEGORY</th>

                              <th>CONTRACT VALUE</th>

                              <th>REG. FEE</th>

                            </tr>

                          </thead>

                          <tbody>

                            {#each categoriesData as cat}

                              <tr>

                                <td>

                                  <strong>{cat.code} - {cat.name}</strong>

                                </td>

                                <td>{cat.contract_value}</td>

                                <td class="text-success fw-bold">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(cat.registration_fee)}</td>

                              </tr>

                            {/each}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  {/if}

                </div>

              </div>



              <!-- Right Side Form -->

              <div class="col-lg-6 d-flex align-items-center justify-content-center bg-white p-5">

                <div class="auth-form w-100" style="max-width: 500px;">

                  <div class="text-center mb-4 d-lg-none">

                    <img src="/images/app-logo.png" alt="logo" style="height: 60px;" class="mb-3" />

                    <h4 class="fw-bold text-black">Contractor Portal</h4>

                  </div>

                  

                  <h3 class="text-center fw-bold mb-2">

                    {step === 1 ? 'Form Purchase' : 'Detailed Profile'}

                  </h3>

                  <p class="text-center text-muted mb-4">

                    {step === 1 ? `Provide basic info and pay ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(registrationFee)} to proceed` : 'Complete your company profile setup'}

                  </p>

        

                  {#if step === 1}

                    <form on:submit|preventDefault={handlePayment}>

                      <div class="mb-3">

                        <label class="form-label fw-medium">Company Name</label>

                        <div class="input-group">

                          <span class="input-group-text bg-white"><i class="isax isax-building"></i></span>

                          <input bind:value={companyName} required type="text" class="form-control" placeholder="Payer / Company Name">

                        </div>

                      </div>

                      <div class="mb-3">

                        <label class="form-label fw-medium">Email Address</label>

                        <div class="input-group">

                          <span class="input-group-text bg-white"><i class="isax isax-sms"></i></span>

                          <input bind:value={email} required type="email" class="form-control" placeholder="hello@example.com">

                        </div>

                      </div>

                      <div class="mb-4">

                        <label class="form-label fw-medium">Phone Number</label>

                        <div class="input-group">

                          <span class="input-group-text bg-white"><i class="isax isax-call"></i></span>

                          <input bind:value={phone} required type="tel" class="form-control" placeholder="+234...">

                        </div>

                      </div>

        

                      <div class="text-center mt-4">

                        <button type="submit" disabled={isProcessing} class="btn btn-primary w-100 py-3 mb-3 fw-bold">

                          {isProcessing ? 'Processing Payment...' : `Pay ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(registrationFee)} via Remita`}

                        </button>

                        <button type="button" on:click={skipPayment} disabled={isProcessing} class="btn btn-light w-100 py-2 text-muted fw-medium border">

                          Skip Payment (Dev Mode)

                        </button>

                      </div>

                    </form>

                  {:else}

                    <!-- Step 2 -->

                    <form on:submit|preventDefault={handleCategoryPayment}>

                      <div class="row">

                        <div class="col-md-6 mb-3">

                          <label class="form-label fw-medium">CAC Number</label>

                          <input bind:value={cacNumber} required type="text" class="form-control" placeholder="RC-123456">

                        </div>

                        <div class="col-md-6 mb-3">

                          <label class="form-label fw-medium">TIN</label>

                          <input bind:value={tin} required type="text" class="form-control" placeholder="TIN Number">

                        </div>

                      </div>

                      

                      <div class="mb-3">

                        <label class="form-label fw-medium">Company Category</label>

                        <select bind:value={category} required class="form-select">

                          {#each categoriesData as cat}

                            <option value={cat.name}>{cat.code} - {cat.name}</option>

                          {/each}

                        </select>

                      </div>

        

                      <div class="mb-3">

                        <label class="form-label fw-medium">Physical Address</label>

                        <textarea bind:value={locationAddress} required class="form-control" rows="2" placeholder="123 Main Street..."></textarea>

                      </div>

        

                      <div class="mb-3">

                        <label class="form-label fw-medium">Postal Address</label>

                        <textarea bind:value={postalAddress} required class="form-control" rows="2" placeholder="P.O. Box 123..."></textarea>

                      </div>

        

                      <hr class="my-4">

                      

                      <div class="mb-4">

                        <label class="form-label fw-medium">Create Password</label>

                        <div class="input-group">

                          <span class="input-group-text bg-white"><i class="isax isax-lock"></i></span>

                          <input bind:value={password} required type="password" class="form-control" placeholder="Enter secure password">

                        </div>

                      </div>

        

                      <div class="text-center mt-4">

                        <button type="submit" disabled={isProcessing} class="btn btn-success w-100 py-3 mb-3 fw-bold text-white">

                          {isProcessing ? 'Processing Payment...' : `Pay ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(categoryFee)} & Complete Setup`}

                        </button>

                        <button type="button" on:click={skipCategoryPayment} disabled={isProcessing} class="btn btn-light w-100 py-2 text-muted fw-medium border">

                          Skip Payment (Dev Mode)

                        </button>

                      </div>

                    </form>

                  {/if}

        

                  <div class="text-center mt-4">

                    <p class="mb-0 text-muted">Already have an account? <a href="/login" on:click|preventDefault={() => navigate('/login')} class="text-primary fw-bold text-decoration-none">Sign in</a></p>

                  </div>

                </div>

              </div>



            </div>

          </div>

        </div>

      </div>

    </div>

  </div>



  <NewFooter />

</div>

