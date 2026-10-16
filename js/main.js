document.addEventListener('DOMContentLoaded', () => {
  const toast = document.querySelector('.toast');
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      });
    });
  }

  document.querySelectorAll('[data-search-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const form = document.querySelector('[data-search-form]');
      if (form) {
        form.classList.toggle('open');
        if (form.classList.contains('open')) form.querySelector('input')?.focus();
      } else {
        showToast('Поле поиска скоро появится.');
      }
    });
  });

  document.querySelectorAll('[data-search-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = form.querySelector('input').value.trim().toLocaleLowerCase('ru');
      const cards = [...document.querySelectorAll('#catalog-grid .movie-card')];
      if (cards.length) {
        cards.forEach(card => card.dataset.searchHidden = String(!card.dataset.title.toLocaleLowerCase('ru').includes(query)));
        applyCatalogFilters();
        document.querySelector('#catalog-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast(query ? 'Результаты поиска обновлены.' : 'Показан весь каталог.');
      } else if (query) {
        window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
      } else {
        showToast('Введите название фильма или сериала.');
      }
    });
  });

  const cards = [...document.querySelectorAll('#catalog-grid .movie-card')];
  const filterValues = { genre: '', year: '', rating: 6, type: '' };

  function applyCatalogFilters() {
    let visibleCount = 0;
    cards.forEach(card => {
      const matchesSearch = card.dataset.searchHidden !== 'true';
      const matchesGenre = !filterValues.genre || card.dataset.genre === filterValues.genre;
      const matchesYear = !filterValues.year || card.dataset.year === filterValues.year;
      const matchesRating = Number(card.dataset.rating) >= Number(filterValues.rating);
      const matchesType = !filterValues.type || card.dataset.type === filterValues.type;
      const visible = matchesSearch && matchesGenre && matchesYear && matchesRating && matchesType;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    const empty = document.querySelector('[data-empty]');
    if (empty) empty.hidden = visibleCount > 0;
  }

  document.querySelectorAll('[data-filter]').forEach(control => {
    const update = () => {
      filterValues[control.dataset.filter] = control.value;
      const label = document.querySelector('[data-rating-label]');
      if (label) label.textContent = Number(filterValues.rating).toFixed(1);
    };
    control.addEventListener('input', update);
    control.addEventListener('change', update);
  });

  document.querySelector('[data-apply-filters]')?.addEventListener('click', () => {
    applyCatalogFilters();
    showToast('Фильтры применены.');
  });

  document.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
    filterValues.genre = '';
    filterValues.year = '';
    filterValues.rating = 6;
    filterValues.type = '';
    document.querySelectorAll('[data-filter]').forEach(control => {
      control.value = control.dataset.filter === 'rating' ? '6' : '';
    });
    cards.forEach(card => card.dataset.searchHidden = 'false');
    const label = document.querySelector('[data-rating-label]');
    if (label) label.textContent = '6.0';
    applyCatalogFilters();
    document.querySelectorAll('[data-quick-filter]').forEach(tag => tag.classList.toggle('active', tag.dataset.quickFilter === ''));
    showToast('Фильтры сброшены.');
  });

  document.querySelectorAll('[data-quick-filter]').forEach(tag => {
    tag.addEventListener('click', () => {
      filterValues.genre = tag.dataset.quickFilter;
      const genreSelect = document.querySelector('[data-filter="genre"]');
      if (genreSelect) genreSelect.value = filterValues.genre;
      document.querySelectorAll('[data-quick-filter]').forEach(item => item.classList.toggle('active', item === tag));
      applyCatalogFilters();
    });
  });

  const sort = document.querySelector('[data-sort]');
  sort?.addEventListener('change', () => {
    const grid = document.querySelector('#catalog-grid');
    const visibleCards = [...grid.children];
    const modes = {
      popular: (a, b) => Number(b.dataset.popularity) - Number(a.dataset.popularity),
      rating: (a, b) => Number(b.dataset.rating) - Number(a.dataset.rating),
      new: (a, b) => Number(b.dataset.year) - Number(a.dataset.year),
      az: (a, b) => a.dataset.title.localeCompare(b.dataset.title, 'ru')
    };
    visibleCards.sort(modes[sort.value]).forEach(card => grid.appendChild(card));
  });

  document.querySelectorAll('[data-page-demo]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.page-number').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      showToast('Это демонстрация макета: страницы каталога пока не разделены.');
    });
  });

  document.querySelectorAll('[data-watchlist]').forEach(button => {
    button.addEventListener('click', () => {
      const title = button.dataset.watchlist;
      const saved = JSON.parse(localStorage.getItem('cinemaWatchlist') || '[]');
      const index = saved.indexOf(title);
      if (index >= 0) {
        saved.splice(index, 1);
        button.textContent = '＋ В список';
        showToast(`«${title}» удалён из списка.`);
      } else {
        saved.push(title);
        button.textContent = '✓ В списке';
        showToast(`«${title}» добавлен в ваш список.`);
      }
      localStorage.setItem('cinemaWatchlist', JSON.stringify(saved));
    });
  });

  document.querySelectorAll('[data-watchlist]').forEach(button => {
    const saved = JSON.parse(localStorage.getItem('cinemaWatchlist') || '[]');
    if (saved.includes(button.dataset.watchlist)) button.textContent = '✓ В списке';
  });

  document.querySelector('[data-play]')?.addEventListener('click', () => {
    showToast('Здесь будет открываться видеоплеер после добавления видео.');
  });

  document.querySelector('[data-share]')?.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href);
        showToast('Ссылка скопирована.');
      } else showToast('Скопируйте адрес страницы из браузера.');
    } catch (error) {
      if (error.name !== 'AbortError') showToast('Не удалось поделиться ссылкой.');
    }
  });

  document.querySelector('[data-review]')?.addEventListener('click', () => {
    const review = prompt('Напишите короткий отзыв о фильме:');
    if (review && review.trim()) showToast('Спасибо! Отзыв сохранён в демо-режиме.');
  });

  document.querySelector('[data-like]')?.addEventListener('click', event => {
    const button = event.currentTarget;
    const liked = button.dataset.liked === 'true';
    button.dataset.liked = String(!liked);
    button.innerHTML = `${liked ? '♡ Полезно' : '♥ Полезно'} <span>${Number(button.querySelector('span').textContent) + (liked ? -1 : 1)}</span>`;
  });

  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('search');
  if (searchQuery && cards.length) {
    document.querySelectorAll('[data-search-form] input').forEach(input => input.value = searchQuery);
    cards.forEach(card => card.dataset.searchHidden = String(!card.dataset.title.toLocaleLowerCase('ru').includes(searchQuery.toLocaleLowerCase('ru'))));
    applyCatalogFilters();
  }
});
