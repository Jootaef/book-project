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
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.errorMessage = document.getElementById('error-message');
        
        // Ensure modal is properly initialized
        if (!this.bookModal) {
            console.warn('Modal not found during initialization, will try again later');
            // Try again after a short delay
            setTimeout(() => {
                this.bookModal = document.getElementById('book-modal');
                if (this.bookModal) {
                    console.log('Modal found on retry');
                } else {
                    console.error('Modal still not found after retry');
                }
            }, 500);
        } else {
            console.log('Modal initialized successfully');
        }
        
        // Initialize after a short delay to ensure all dependencies are loaded
        setTimeout(() => {
            this.initializeGenreSelect();
            this.initializeEventListeners();
            this.initializeIntersectionObserver();
        }, 100);
    }

    initializeGenreSelect() {
        try {
            // Clear existing options except the first one
            while (this.genreSelect.options.length > 1) {
                this.genreSelect.remove(1);
            }

            // Add genre options only if bookAPI is available
            if (typeof bookAPI !== 'undefined' && bookAPI.getGenres) {
                const genres = bookAPI.getGenres();
                genres.forEach(genre => {
                    const option = document.createElement('option');
                    option.value = genre.toLowerCase();
                    option.textContent = genre;
                    this.genreSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error initializing genre select:', error);
        }
    }

    initializeEventListeners() {
        console.log('=== Initializing Event Listeners ===');
        
        // Search input events
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.searchInput.addEventListener('keypress', this.handleSearchKeyPress.bind(this));
        
        // Genre select events
        this.genreSelect.addEventListener('change', this.handleGenreChange.bind(this));
        
        // Sort events
        this.sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        
        // Theme toggle events
        console.log('Setting up theme toggle event for:', this.themeToggle);
        this.themeToggle.addEventListener('mouseover', this.handleThemeHover.bind(this));
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        console.log('Theme toggle event listener added');
        
        // Modal events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal(this.bookModal));
        });
        
        // Close modal when clicking outside
        this.bookModal.addEventListener('click', (e) => {
            if (e.target === this.bookModal) {
                this.hideModal(this.bookModal);
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.bookModal.classList.contains('show')) {
                this.hideModal(this.bookModal);
            }
        });
        
        // Star rating events
        document.querySelectorAll('.star-rating .star').forEach(star => {
            star.addEventListener('mouseover', this.handleStarHover.bind(this));
            star.addEventListener('mouseout', this.handleStarOut.bind(this));
            star.addEventListener('click', this.handleStarClick.bind(this));
        });

        // Window events
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Book card events
        this.booksContainer.addEventListener('mouseover', this.handleBookCardHover.bind(this));
        this.booksContainer.addEventListener('mouseout', this.handleBookCardOut.bind(this));
        
        console.log('=== Event Listeners Initialized ===');
    }

    initializeIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (entry.target.classList.contains('recommendations-section')) {
                        this.loadRecommendations(entry.target.dataset.bookId);
                    }
                }
            });
        }, options);
    }

    // Event Handlers
    handleSearchInput(e) {
        const query = e.target.value;
        if (query.length >= 3) {
            this.showSearchSuggestions(query);
        }
    }

    handleSearchKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.performSearch();
        }
    }

    handleGenreChange(e) {
        this.currentGenre = e.target.value;
        this.performSearch();
    }

    handleSortChange(e) {
        const books = Array.from(this.booksContainer.children);
        const sortedBooks = this.sortBooks(books, e.target.value);
        this.displayBooks(sortedBooks);
    }

    handleThemeHover(e) {
        e.target.style.transform = 'scale(1.1)';
    }

    handleStarHover(e) {
        const rating = e.target.dataset.rating;
        this.updateStarDisplay(rating);
    }

    handleStarOut() {
        const currentRating = document.querySelector('.star-rating').dataset.currentRating || 0;
        this.updateStarDisplay(currentRating);
    }

    handleStarClick(e) {
        const rating = e.target.dataset.rating;
        document.querySelector('.star-rating').dataset.currentRating = rating;
        this.updateStarDisplay(rating);
    }

    handleScroll() {
        const scrollPosition = window.scrollY;
        if (scrollPosition > 100) {
            document.querySelector('.navbar').classList.add('scrolled');
        } else {
            document.querySelector('.navbar').classList.remove('scrolled');
        }
    }

    handleResize() {
        this.updateLayout();
    }

    handleBookCardHover(e) {
        const card = e.target.closest('.book-card');
        if (card) {
            card.classList.add('hover');
        }
    }

    handleBookCardOut(e) {
        const card = e.target.closest('.book-card');
        if (card) {
            card.classList.remove('hover');
        }
    }

    async handleReviewSubmit(e) {
        e.preventDefault();
        const bookId = this.bookModal.querySelector('.book-details').dataset.bookId;
        const rating = document.querySelector('.star-rating').dataset.currentRating;
        const reviewText = document.getElementById('review-text').value;

        if (!rating) {
            this.showError('Please select a rating');
            return;
        }

        try {
            await this.submitReview(bookId, {
                rating: parseInt(rating),
                text: reviewText,
                date: new Date().toISOString()
            });
            this.hideModal(this.reviewModal);
            this.showSuccess('Review submitted successfully!');
        } catch (error) {
            this.showError('Error submitting review. Please try again.');
        }
    }

    // UI Update Methods
    updateStarDisplay(rating) {
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach(star => {
            const starRating = star.dataset.rating;
            star.classList.toggle('filled', starRating <= rating);
            star.classList.toggle('half', starRating - 0.5 === rating);
        });
    }

    updateLayout() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-view', isMobile);
        this.booksContainer.classList.toggle('grid-view', !isMobile);
        this.booksContainer.classList.toggle('list-view', isMobile);
    }

    showSearchSuggestions(query) {
        // Implement search suggestions
        const suggestions = this.getSearchSuggestions(query);
        this.displaySuggestions(suggestions);
    }

    async loadRecommendations(bookId) {
        try {
            const recommendations = await bookAPI.getBookRecommendations(bookId);
            if (recommendations) {
                this.displayRecommendations(recommendations);
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    // Book Card Creation
    createBookCard(book) {
        console.log('Creating book card for:', book.title);
        
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
            console.log('Book card clicked:', book.title);
            if (!e.target.closest('.favorite-btn')) {
                console.log('Showing book details for:', book.title);
                // Try UI method first, fallback to global function
                if (this.showBookDetails) {
                    this.showBookDetails(book);
                } else if (window.showBookModal) {
                    window.showBookModal(book);
                } else {
                    console.error('No modal function available');
                    alert('Modal not available. Please refresh the page.');
                }
            } else {
                console.log('Favorite button clicked, not showing details');
            }
        });

        // Add click event for favorite button
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Favorite button clicked for:', book.title);
            this.toggleFavorite(book, favoriteBtn);
        });

        console.log('Book card created successfully for:', book.title);
        return card;
    }

    toggleFavorite(book, button) {
        console.log('Toggle favorite called for book:', book.title);
        const isFavorite = storageManager.isFavorite(book.id);
        console.log('Is favorite:', isFavorite);
        if (isFavorite) {
            storageManager.removeFromFavorites(book.id);
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.classList.remove('favorited');
            console.log('Removed from favorites');
        } else {
            storageManager.addToFavorites(book);
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.classList.add('favorited');
            console.log('Added to favorites');
        }
        
        // Update the book card if it exists
        const bookCard = document.querySelector(`[data-book-id="${book.id}"]`);
        if (bookCard) {
            const cardFavoriteBtn = bookCard.querySelector('.favorite-btn');
            if (cardFavoriteBtn) {
                cardFavoriteBtn.innerHTML = `<i class="${!isFavorite ? 'fas' : 'far'} fa-heart"></i>`;
                cardFavoriteBtn.classList.toggle('favorited', !isFavorite);
            }
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

    // Book Details Modal - Simplified for GitHub Pages compatibility
    async showBookDetails(book) {
        console.log('=== Showing Book Details ===');
        console.log('Book:', book);
        
        // Find modal directly
        const modal = document.getElementById('book-modal');
        if (!modal) {
            console.error('Modal not found!');
            alert('Modal not available. Please refresh the page.');
            return;
        }
        
        try {
            // Get all modal elements
            const cover = document.getElementById('modal-cover');
            const title = document.getElementById('modal-title');
            const author = document.getElementById('modal-author');
            const description = document.getElementById('modal-description');
            const rating = document.getElementById('modal-rating');
            const favoriteBtn = document.getElementById('add-to-favorites');
            const genres = document.getElementById('modal-genres');

            // Set book data
            if (cover) cover.src = book.coverImage || 'https://via.placeholder.com/200x300?text=No+Cover';
            if (title) title.textContent = book.title || 'Unknown Title';
            if (author) author.textContent = book.authors && book.authors.length > 0 ? book.authors.join(', ') : 'Unknown Author';
            if (description) description.textContent = book.description || 'No description available.';
            if (rating) rating.innerHTML = this.createStarRating(book.averageRating || 0);
            
            // Set genres
            if (genres && book.genres && book.genres.length > 0) {
                genres.innerHTML = book.genres.map(genre => 
                    `<span class="genre-tag">${genre}</span>`
                ).join('');
            } else if (genres) {
                genres.innerHTML = '';
            }

            // Set favorite button
            if (favoriteBtn) {
                const isFavorite = storageManager && storageManager.isFavorite ? storageManager.isFavorite(book.id) : false;
                favoriteBtn.innerHTML = isFavorite ? 
                    '<i class="fas fa-heart"></i> Remove from Favorites' : 
                    '<i class="far fa-heart"></i> Add to Favorites';
                favoriteBtn.className = `favorite-btn ${isFavorite ? 'favorited' : ''}`;

                favoriteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleFavorite(book, favoriteBtn);
                };
            }

            // Show modal using direct style manipulation
            modal.style.display = 'flex';
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
            modal.classList.remove('hidden');
            modal.classList.add('show');
            
            console.log('Modal should now be visible');
            
        } catch (error) {
            console.error('Error showing book details:', error);
            alert('Error loading book details. Please try again.');
        }
    }

    // Modal Management - Simplified for GitHub Pages
    hideModal(modal) {
        console.log('=== Hiding Modal ===');
        
        // If no modal provided, find it
        if (!modal) {
            modal = document.getElementById('book-modal');
        }
        
        if (modal) {
            // Hide modal using direct style manipulation
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            modal.classList.remove('show');
            modal.classList.add('hidden');
            console.log('Modal hidden successfully');
        } else {
            console.error('Modal not found for hiding');
        }
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
        console.log('=== Theme Toggle Called ===');
        
        // Get current theme
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        console.log('Current theme:', currentTheme);
        
        // Determine new theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log('New theme:', newTheme);
        
        // Apply the new theme
        document.body.setAttribute('data-theme', newTheme);
        
        // Save to storage
        if (typeof storageManager !== 'undefined') {
            storageManager.setTheme(newTheme);
        } else {
            localStorage.setItem('preferredTheme', newTheme);
        }
        
        // Update the toggle button icon - ensure it's always visible
        if (this.themeToggle) {
            this.themeToggle.innerHTML = newTheme === 'dark' ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
            console.log('Button icon updated to:', newTheme === 'dark' ? 'sun' : 'moon');
        } else {
            console.error('Theme toggle button not found!');
        }
        
        console.log('Theme toggled successfully to:', newTheme);
        console.log('Body data-theme is now:', document.body.getAttribute('data-theme'));
        
        // Update test button if it exists
        if (typeof updateTestButtonText === 'function') {
            updateTestButtonText();
        }
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