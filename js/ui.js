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
        this.initializeEventListeners();
        this.initializeIntersectionObserver();
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

    initializeEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.searchInput.addEventListener('keypress', this.handleSearchKeyPress.bind(this));
        
        // Genre select events
        this.genreSelect.addEventListener('change', this.handleGenreChange.bind(this));
        
        // Sort events
        this.sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        
        // Theme toggle events
        this.themeToggle.addEventListener('mouseover', this.handleThemeHover.bind(this));
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        
        // Modal events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal(this.bookModal));
        });
        
        // Review form events
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', this.handleReviewSubmit.bind(this));
        }
        
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
            storageManager.addReview(bookId, {
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

    updateStarDisplay(rating) {
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach(star => {
            const starRating = star.dataset.rating;
            star.classList.toggle('filled', starRating <= rating);
            star.classList.toggle('half', starRating - 0.5 === rating);
        });
    }

    // UI Update Methods
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
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.bookId = book.id;
        card.dataset.rating = book.averageRating;
        card.dataset.publishedDate = book.publishedDate;
        card.dataset.genres = book.genres.join(',');
        
        card.innerHTML = `
            <div class="book-cover">
                <img src="${book.coverImage}" alt="${book.title} cover" onerror="this.src='https://via.placeholder.com/128x192?text=No+Cover'">
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
    async showBookDetails(book) {
        const modal = this.bookModal;
        this.showLoading();

        try {
            // Get enhanced book details including Open Library data
            const enhancedBook = await bookAPI.getEnhancedBookDetails(book.id);
            
            // Get modal elements with null checks
            const cover = document.getElementById('modal-cover');
            const title = document.getElementById('modal-title');
            const author = document.getElementById('modal-author');
            const description = document.getElementById('modal-description');
            const rating = document.getElementById('modal-rating');
            const favoriteBtn = document.getElementById('add-to-favorites');
            const genres = document.getElementById('modal-genres');

            if (!cover || !title || !author || !description || !rating || !favoriteBtn) {
                throw new Error('Modal elements not found');
            }

            modal.querySelector('.book-details').dataset.bookId = enhancedBook.id;
            
            // Use enhanced cover if available
            cover.src = enhancedBook.enhancedCover || enhancedBook.coverImage;
            cover.alt = `${enhancedBook.title} cover`;
            title.textContent = enhancedBook.title;
            author.textContent = enhancedBook.authors.join(', ');
            
            // Combine descriptions if available
            let fullDescription = enhancedBook.description;
            if (enhancedBook.openLibrary?.description) {
                fullDescription += '\n\n' + enhancedBook.openLibrary.description;
            }
            description.textContent = fullDescription;
            
            rating.innerHTML = this.createStarRating(enhancedBook.averageRating);
            
            // Combine genres from both sources
            const allGenres = new Set([
                ...enhancedBook.genres,
                ...(enhancedBook.openLibrary?.subjects || [])
            ]);
            
            if (genres) {
                genres.innerHTML = Array.from(allGenres).map(genre => 
                    `<span class="genre-tag">${genre}</span>`
                ).join('');
            }

            // Add additional Open Library information if available
            let additionalInfo = '';
            if (enhancedBook.openLibrary) {
                additionalInfo = `
                    <div class="additional-info">
                        <h3>Additional Information</h3>
                        ${enhancedBook.openLibrary.numberOfPages ? 
                            `<p><strong>Pages:</strong> ${enhancedBook.openLibrary.numberOfPages}</p>` : ''}
                        ${enhancedBook.openLibrary.publishDate ? 
                            `<p><strong>Published:</strong> ${enhancedBook.openLibrary.publishDate}</p>` : ''}
                        ${enhancedBook.openLibrary.publishers?.length ? 
                            `<p><strong>Publishers:</strong> ${enhancedBook.openLibrary.publishers.join(', ')}</p>` : ''}
                        ${enhancedBook.openLibrary.languages?.length ? 
                            `<p><strong>Languages:</strong> ${enhancedBook.openLibrary.languages.join(', ')}</p>` : ''}
                        ${enhancedBook.openLibrary.firstSentence ? 
                            `<p><strong>First Sentence:</strong> ${enhancedBook.openLibrary.firstSentence}</p>` : ''}
                    </div>
                `;
            }

            // Add author information if available
            if (enhancedBook.authors.length > 0) {
                try {
                    const authorDetails = await bookAPI.getAuthorEnhancedDetails(enhancedBook.authors[0]);
                    if (authorDetails) {
                        additionalInfo += `
                            <div class="author-info">
                                <h3>About the Author</h3>
                                <p>${authorDetails.bio}</p>
                                ${authorDetails.birthDate ? 
                                    `<p><strong>Born:</strong> ${authorDetails.birthDate}</p>` : ''}
                                ${authorDetails.deathDate ? 
                                    `<p><strong>Died:</strong> ${authorDetails.deathDate}</p>` : ''}
                            </div>
                        `;
                    }
                } catch (authorError) {
                    console.error('Error loading author details:', authorError);
                    // Continue without author details
                }
            }

            // Add the additional information to the modal
            const additionalInfoContainer = modal.querySelector('.additional-info-container') || 
                document.createElement('div');
            additionalInfoContainer.className = 'additional-info-container';
            additionalInfoContainer.innerHTML = additionalInfo;
            
            if (!modal.querySelector('.additional-info-container')) {
                const bookInfo = modal.querySelector('.book-info');
                if (bookInfo) {
                    bookInfo.appendChild(additionalInfoContainer);
                }
            }

            // Add reviews section
            const reviews = storageManager.getReviews(enhancedBook.id);
            const reviewsContainer = modal.querySelector('.reviews-container') || 
                document.createElement('div');
            reviewsContainer.className = 'reviews-container';
            
            if (reviews.length > 0) {
                const reviewsHTML = `
                    <div class="reviews-section">
                        <h3>Your Reviews (${reviews.length})</h3>
                        ${reviews.map(review => `
                            <div class="review-item">
                                <div class="review-rating">
                                    ${this.createStarRating(review.rating)}
                                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                                </div>
                                <p class="review-text">${review.text}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
                reviewsContainer.innerHTML = reviewsHTML;
            } else {
                const reviewsHTML = `
                    <div class="reviews-section">
                        <h3>Your Reviews</h3>
                        <div class="no-reviews">
                            <p>No reviews yet. Be the first to review this book!</p>
                        </div>
                    </div>
                `;
                reviewsContainer.innerHTML = reviewsHTML;
            }
            
            if (!modal.querySelector('.reviews-container')) {
                const bookInfo = modal.querySelector('.book-info');
                if (bookInfo) {
                    bookInfo.appendChild(reviewsContainer);
                }
            }

            const isFavorite = storageManager.isFavorite(enhancedBook.id);
            favoriteBtn.innerHTML = isFavorite ? 
                '<i class="fas fa-heart"></i> Remove from Favorites' : 
                '<i class="far fa-heart"></i> Add to Favorites';

            favoriteBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleFavorite(enhancedBook, favoriteBtn);
            };

            modal.classList.remove('hidden');
        } catch (error) {
            console.error('Error showing book details:', error);
            this.showError('Error loading book details. Please try again.');
        } finally {
            this.hideLoading();
        }
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

    // Success Handling
    showSuccess(message) {
        // Create success message element if it doesn't exist
        let successMessage = document.getElementById('success-message');
        if (!successMessage) {
            successMessage = document.createElement('div');
            successMessage.id = 'success-message';
            successMessage.className = 'success-message hidden';
            document.body.appendChild(successMessage);
        }
        
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
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
        try {
            switch (sortBy) {
                case 'newest':
                    return books.sort((a, b) => {
                        const dateA = new Date(a.publishedDate || '1900-01-01');
                        const dateB = new Date(b.publishedDate || '1900-01-01');
                        return dateB - dateA;
                    });
                case 'rating':
                    return books.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                default:
                    return books;
            }
        } catch (error) {
            console.error('Error in sortBooks:', error);
            return books; // Return original order if sorting fails
        }
    }

    // Review Modal
    showReviewForm(bookId) {
        console.log('showReviewForm called with bookId:', bookId);
        
        const modal = document.getElementById('review-modal');
        if (!modal) {
            console.error('Review modal not found');
            return;
        }

        // Reset modal content to original form
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Add Your Review</h2>
                <form id="review-form">
                    <div class="star-rating">
                        <span class="star" data-rating="1">★</span>
                        <span class="star" data-rating="2">★</span>
                        <span class="star" data-rating="3">★</span>
                        <span class="star" data-rating="4">★</span>
                        <span class="star" data-rating="5">★</span>
                    </div>
                    <textarea id="review-text" placeholder="Write your review here..."></textarea>
                    <button type="submit">Submit Review</button>
                </form>
            </div>
        `;

        // Set up star rating functionality
        let selectedRating = 0;
        const stars = modal.querySelectorAll('.star');
        const form = modal.querySelector('#review-form');
        const reviewText = modal.querySelector('#review-text');

        console.log('Stars found:', stars.length);

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                selectedRating = rating;
                console.log('Star clicked, rating:', rating);
                
                // Update star display
                stars.forEach(s => {
                    const starRating = parseInt(s.dataset.rating);
                    s.classList.toggle('filled', starRating <= rating);
                });
            });
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted');
            
            const reviewTextValue = reviewText.value.trim();

            // Validate input
            if (selectedRating === 0) {
                this.showError('Please select a rating');
                return;
            }

            if (!reviewTextValue) {
                this.showError('Please write a review');
                return;
            }

            try {
                // Save the review
                storageManager.addReview(bookId, {
                    rating: selectedRating,
                    text: reviewTextValue,
                    date: new Date().toISOString()
                });

                // Show success message
                this.showSuccess('Review submitted successfully!');

                // Close modal
                this.hideModal(modal);

                console.log('Review saved for book:', bookId, 'Rating:', selectedRating, 'Text:', reviewTextValue);
            } catch (error) {
                console.error('Error saving review:', error);
                this.showError('Error saving review. Please try again.');
            }
        });

        // Add close button functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            this.hideModal(modal);
        });

        modal.classList.remove('hidden');
        console.log('Review modal shown');
    }

    // Show Reviews Modal
    showReviews(bookId) {
        console.log('showReviews called with bookId:', bookId);
        
        const reviews = storageManager.getReviews(bookId);
        const modal = this.reviewModal;
        
        if (!modal) {
            console.error('Review modal not found');
            return;
        }
        
        // Change modal content to show reviews
        const title = modal.querySelector('h2');
        const form = modal.querySelector('#review-form');
        
        if (!title || !form) {
            console.error('Required modal elements not found');
            return;
        }
        
        title.textContent = 'Your Reviews';
        
        if (reviews.length > 0) {
            const reviewsHTML = `
                <div class="reviews-list">
                    ${reviews.map(review => `
                        <div class="review-item">
                            <div class="review-rating">
                                ${this.createStarRating(review.rating)}
                                <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                            </div>
                            <p class="review-text">${review.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            form.innerHTML = reviewsHTML;
        } else {
            const noReviewsHTML = `
                <div class="no-reviews">
                    <p>No reviews yet. Be the first to review this book!</p>
                    <button onclick="ui.showReviewForm('${bookId}')" class="add-review-btn">
                        Add Your First Review
                    </button>
                </div>
            `;
            form.innerHTML = noReviewsHTML;
        }
        
        modal.classList.remove('hidden');
        console.log('Reviews modal shown with', reviews.length, 'reviews');
    }
} 
} 