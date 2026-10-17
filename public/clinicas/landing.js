const clinicName = document.querySelector('#clinic-name');
const previewName = document.querySelector('#clinic-preview-name');
const initials = document.querySelector('#clinic-initials');
const preview = document.querySelector('#clinic-preview');
const palettes = {
  forest: ['#234b42', '#edf2e9'],
  ocean: ['#235568', '#e7f0f3'],
  clay: ['#794b3e', '#f3eae4'],
};
function updateName() {
  const name = clinicName.value.trim() || 'Tu clínica';
  previewName.textContent = name;
  initials.textContent = name.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
}
clinicName.addEventListener('input', updateName);
document.querySelectorAll('input[name="clinic-color"]').forEach(input => {
  input.addEventListener('change', () => {
    const [primary, soft] = palettes[input.value];
    preview.style.setProperty('--clinic', primary);
    preview.style.setProperty('--clinic-soft', soft);
  });
});
