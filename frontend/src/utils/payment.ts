export function loadRemitaScript() {
  if (!document.getElementById('remita-script')) {
    const script = document.createElement('script');
    script.id = 'remita-script';
    script.src = 'https://demo.remita.net/payment/v1/remita-pay-inline.bundle.js';
    document.body.appendChild(script);
  }
}

export interface RemitaPaymentOptions {
  transactionId: string;
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  narration: string;
  onSuccess: (response: any) => void;
  onError: (response: any) => void;
  onClose: () => void;
}

export function processRemitaPayment(options: RemitaPaymentOptions) {
  // @ts-ignore - RmPaymentEngine is attached to the window object by the remita script
  if (!window.RmPaymentEngine) {
    throw new Error("Payment engine is not loaded yet. Please try again in a few seconds.");
  }

  // @ts-ignore
  const paymentEngine = window.RmPaymentEngine.init({
    key: "QzAwMDAyNzEyNTl8MTEwNjE4NjF8OThjNGEyZTZlNTc3MjI1YmM3YjBlNjhlM2U4N2FjOWQwNjZiZDFiYTVmZmY0MWFlNWRkMzNjZTJjYzllZjE1NDlkNmViNDBiNWJkNzUyOWUyNmIzMjZlNDNlZjEyNzE3ODkzZjc4OWY0NmNjZmM1ZWI3ZWJkMjk1N2VjZTBlMzQ=", // Demo public key
    transactionId: options.transactionId,
    amount: options.amount,
    email: options.email,
    firstName: options.firstName,
    lastName: options.lastName,
    phoneNumber: options.phoneNumber,
    narration: options.narration,
    onSuccess: options.onSuccess,
    onError: options.onError,
    onClose: options.onClose,
  });

  paymentEngine.showPaymentWidget();
}
