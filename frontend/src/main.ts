import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

if (localStorage.getItem("_x_darkMode_on") === "true") {
  document.documentElement.classList.add("dark");
}

window.addEventListener("DOMContentLoaded", () => {
  // @ts-ignore
  if (window.Alpine) {
    // @ts-ignore
    window.Alpine.start();
  }
});

export default app
