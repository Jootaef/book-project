class UI {
    constructor() {
        this.booksContainer = document.getElementById('books-container');
        this.searchInput = document.getElementById('search-input');
        this.genreSelect = document.getElementById('genre-select');
        this.searchButton = document.getElementById('search-button');
        this.randomButton = document.getElementById('random-button');
        this.sortSelect = document.getElementById('sort-select');
        this.themeToggle = document.getElementById('theme-toggle');
        this.bookModal = document.getElementById('book-modal');
        this.reviewModal = document.getElementById('review-modal');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.errorMessage = document.getElementById('error-message');
        
        this.initializeGenreSelect();
    }

    initializeGenreSelect() {
        // Clear existing options except the first one
        while (this.genreSelect.options.length > 1) {
            this.genreSelect.remove(1);
        }

        // Add genre options
        const genres = bookAPI.getGenres();
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.toLowerCase();
            option.textContent = genre;
            this.genreSelect.appendChild(option);
        });
    }

    // Book Card Creation
    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.bookId = book.id;
        card.dataset.rating = book.averageRating;
        card.dataset.publishedDate = book.publishedDate;
        card.dataset.genres = book.genres.join(',');
        
        card.innerHTML = `
            <div class="book-cover">
                <img src="${book.coverImage}" alt="${book.title} cover">
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>${book.authors.join(', ')}</p>
                <div class="genres">
                    ${book.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                </div>
                <div class="rating">
                    ${this.createStarRating(book.averageRating)}
                </div>
                <button class="favorite-btn" data-book-id="${book.id}">
                    <i class="${storageManager.isFavorite(book.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        `;

        // Add click event for book details
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                this.showBookDetails(book);
            }
        });

        // Add click event for favorite button
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(book, favoriteBtn);
        });

        return card;
    }

    toggleFavorite(book, button) {
        const isFavorite = storageManager.isFavorite(book.id);
        if (isFavorite) {
            storageManager.removeFromFavorites(book.id);
            button.innerHTML = '<i class="far fa-heart"></i>';
        } else {
            storageManager.addToFavorites(book);
            button.innerHTML = '<i class="fas fa-heart"></i>';
        }
    }

    createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<span class="star filled">★</span>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<span class="star half">★</span>';
            } else {
                stars += '<span class="star">☆</span>';
            }
        }

        return `<div class="star-rating">${stars}</div>`;
    }

    // Book Details Modal
    showBookDetails(book) {
        const modal = this.bookModal;
        const cover = document.getElementById('modal-cover');
        const title = document.getElementById('modal-title');
        const author = document.getElementById('modal-author');
        const description = document.getElementById('modal-description');
        const rating = document.getElementById('modal-rating');
        const favoriteBtn = document.getElementById('add-to-favorites');
        const genres = document.getElementById('modal-genres');

        modal.querySelector('.book-details').dataset.bookId = book.id;
        cover.src = book.coverImage;
        cover.alt = `${book.title} cover`;
        title.textContent = book.title;
        author.textContent = book.authors.join(', ');
        description.textContent = book.description;
        rating.innerHTML = this.createStarRating(book.averageRating);
        genres.innerHTML = book.genres.map(genre => 
            `<span class="genre-tag">${genre}</span>`
        ).join('');

        const isFavorite = storageManager.isFavorite(book.id);
        favoriteBtn.innerHTML = isFavorite ? 
            '<i class="fas fa-heart"></i> Remove from Favorites' : 
            '<i class="far fa-heart"></i> Add to Favorites';

        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleFavorite(book, favoriteBtn);
        };

        modal.classList.remove('hidden');
    }

    // Review Modal
    showReviewForm(bookId) {
        const modal = this.reviewModal;
        const form = document.getElementById('review-form');
        const stars = modal.querySelectorAll('.star');

        stars.forEach(star => {
            star.onclick = () => {
                const rating = star.dataset.rating;
                stars.forEach(s => {
                    s.classList.toggle('filled', s.dataset.rating <= rating);
                });
            };
        });

        form.onsubmit = (e) => {
            e.preventDefault();
            const rating = modal.querySelector('.star.filled')?.dataset.rating || '0';
            const reviewText = document.getElementById('review-text').value;

            storageManager.addReview(bookId, {
                rating: parseInt(rating),
                text: reviewText
            });

            this.hideModal(modal);
            this.showBookDetails(storageManager.getFavorites().find(b => b.id === bookId) || 
                               { id: bookId });
        };

        modal.classList.remove('hidden');
    }

    // Modal Management
    hideModal(modal) {
        modal.classList.add('hidden');
    }

    // Loading State
    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }

    // Error Handling
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        setTimeout(() => {
            this.errorMessage.classList.add('hidden');
        }, 5000);
    }

    // Theme Toggle
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        storageManager.setTheme(newTheme);
        this.themeToggle.innerHTML = newTheme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }

    // Book Grid Management
    clearBooks() {
        this.booksContainer.innerHTML = '';
    }

    displayBooks(books) {
        this.clearBooks();
        if (books.length === 0) {
            this.booksContainer.innerHTML = '<p class="no-books">No books found</p>';
            return;
        }
        books.forEach(book => {
            this.booksContainer.appendChild(this.createBookCard(book));
        });
    }

    // Sort Books
    sortBooks(books, sortBy) {
        switch (sortBy) {
            case 'newest':
                return books.sort((a, b) => 
                    new Date(b.publishedDate) - new Date(a.publishedDate));
            case 'rating':
                return books.sort((a, b) => b.averageRating - a.averageRating);
            default:
                return books;
        }
    }
} 