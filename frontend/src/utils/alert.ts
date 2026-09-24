import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#4f46e5',
  });
};

export const confirmAction = async (title: string, text: string, confirmButtonText = 'Yes, do it!') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#ef4444',
    confirmButtonText
  });
};
