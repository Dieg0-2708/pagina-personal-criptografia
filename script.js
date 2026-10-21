'use strict';

const settings = window.DIEGO_SITE || {};
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
});

navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});
window.matchMedia('(min-width: 601px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

if (settings.profile) {
  const portrait = document.getElementById('profile-photo');
  portrait.src = settings.profile.image;
  portrait.alt = settings.profile.alt;
  if (settings.profile.imagePosition) portrait.style.objectPosition = settings.profile.imagePosition;
  portrait.closest('figure').classList.toggle('has-photo', !settings.profile.pending);
  document.getElementById('profile-caption').hidden = !settings.profile.pending;
}

if (settings.hobbiesIntro) document.getElementById('hobbies-intro').textContent = settings.hobbiesIntro;
const gallery = document.getElementById('hobbies-grid');
const photoDialog = document.getElementById('photo-dialog');
let lastPhotoButton = null;

function openPhoto(hobby, button) {
  lastPhotoButton = button;
  photoDialog.querySelector('img').src = hobby.image;
  photoDialog.querySelector('img').alt = hobby.alt;
  photoDialog.querySelector('p').textContent = hobby.title;
  photoDialog.showModal();
}

if (Array.isArray(settings.hobbies) && settings.hobbies.length) {
  gallery.replaceChildren();
  settings.hobbies.forEach((hobby, index) => {
    const article = document.createElement('article');
    article.className = 'hobby';
    const imageContainer = document.createElement('div');
    imageContainer.className = 'hobby-image';
    const img = document.createElement('img');
    Object.assign(img, { src: hobby.image, alt: hobby.alt, width: 720, height: 560, loading: 'lazy' });
    if (hobby.imageFit) img.style.objectFit = hobby.imageFit;
    if (hobby.imagePosition) img.style.objectPosition = hobby.imagePosition;
    if (hobby.imageFit === 'contain') imageContainer.classList.add('contain-image');
    if (hobby.pending) {
      imageContainer.append(img);
    } else {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Ampliar fotografía: ${hobby.title}`);
      button.append(img);
      button.addEventListener('click', () => openPhoto(hobby, button));
      imageContainer.append(button);
    }
    const heading = document.createElement('div');
    heading.className = 'hobby-heading';
    const title = document.createElement('h3');
    title.textContent = hobby.title;
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    heading.append(title, number);
    const description = document.createElement('p');
    description.textContent = hobby.description;
    article.append(imageContainer, heading, description);
    if (hobby.credit && hobby.creditUrl) {
      const credit = document.createElement('a');
      credit.className = 'hobby-credit';
      credit.textContent = hobby.credit;
      credit.href = hobby.creditUrl;
      credit.target = '_blank';
      credit.rel = 'noopener noreferrer';
      article.append(credit);
    }
    gallery.append(article);
  });
}

photoDialog.querySelector('.dialog-close').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', event => {
  if (event.target === photoDialog) {
    const rect = photoDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) photoDialog.close();
  }
});
photoDialog.addEventListener('close', () => { if (lastPhotoButton) lastPhotoButton.focus(); });

// Ejemplo matemático de RSA. Estos números son didácticos, no una llave personal.
function modPow(base, exponent, modulus) {
  let result = 1n;
  let value = BigInt(base) % BigInt(modulus);
  let power = BigInt(exponent);
  const n = BigInt(modulus);
  while (power > 0n) {
    if (power % 2n === 1n) result = result * value % n;
    value = value * value % n;
    power /= 2n;
  }
  return Number(result);
}

let lastCipher = modPow(42, 7, 143);
const messageInput = document.getElementById('rsa-message');
const recoveredOutput = document.getElementById('rsa-recovered');
const rsaError = document.getElementById('rsa-error');

document.getElementById('rsa-form').addEventListener('submit', event => {
  event.preventDefault();
  const raw = messageInput.value.trim();
  const message = Number(raw);
  if (!raw || !Number.isInteger(message) || message < 0 || message > 142) {
    rsaError.textContent = 'Escribe un número entero entre 0 y 142.';
    messageInput.setAttribute('aria-invalid', 'true');
    messageInput.focus();
    return;
  }
  rsaError.textContent = '';
  messageInput.removeAttribute('aria-invalid');
  lastCipher = modPow(message, 7, 143);
  document.getElementById('rsa-cipher').textContent = String(lastCipher);
  document.getElementById('rsa-equation').textContent = `${message}⁷ mod 143 = ${lastCipher}`;
  recoveredOutput.hidden = true;
  recoveredOutput.textContent = '';
});

document.getElementById('rsa-decrypt').addEventListener('click', () => {
  const original = modPow(lastCipher, 103, 143);
  recoveredOutput.textContent = `Recuperamos el original: ${original}. ${lastCipher}¹⁰³ mod 143 = ${original}.`;
  recoveredOutput.hidden = false;
});

messageInput.addEventListener('input', () => {
  rsaError.textContent = '';
  messageInput.removeAttribute('aria-invalid');
  recoveredOutput.hidden = true;
});

document.getElementById('copy-email').addEventListener('click', async () => {
  const email = 'dcr2708@outlook.com';
  const status = document.getElementById('copy-status');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(email);
    } else {
      const field = document.createElement('textarea');
      field.value = email;
      field.setAttribute('readonly', '');
      Object.assign(field.style, { position: 'fixed', top: '-1000px' });
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('copy unavailable');
    }
    status.textContent = 'Correo copiado. ¡Seguimos en contacto!';
  } catch {
    status.textContent = `Puedes copiar mi correo: ${email}`;
  }
});

if (settings.publicKey) {
  const link = document.querySelector('a.download-row[href="#llave-publica"]');
  link.href = settings.publicKey;
  link.setAttribute('download', '');
  document.getElementById('key-short-status').textContent = 'Descargar mi llave pública';
  document.getElementById('key-description').textContent = 'Puedes descargar mi llave pública desde el enlace de arriba.';
}

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main > section[id]').forEach(section => sectionObserver.observe(section));
}
