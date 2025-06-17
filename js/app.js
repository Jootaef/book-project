// Initialize API and Storage
const bookAPI = new BookAPI();
const storageManager = new StorageManager();
const ui = new UI();

// Initialize theme
const savedTheme = storageManager.getTheme();
document.body.setAttribute('data-theme', savedTheme);
ui.themeToggle.innerHTML = savedTheme === 'dark' ? 
    '<i class="fas fa-sun"></i>' : 
    '<i class="fas fa-moon"></i>';

// Load initial books when the page loads
async function loadInitialBooks() {
    try {
        ui.showLoading();
        const books = await bookAPI.searchBooks('popular books');
        ui.displayBooks(books);
        
        // Add a test review for testing purposes
        storageManager.addReview('test-book-id', {
            rating: 5,
            text: 'This is a test review to verify the review system is working correctly.',
            date: new Date().toISOString()
        });
        console.log('Test review added to storage');
    } catch (error) {
        ui.showError('Failed to load initial books. Please try again later.');
    } finally {
        ui.hideLoading();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial books
    loadInitialBooks();

    // Search functionality
    ui.searchButton.addEventListener('click', handleSearch);
    ui.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Random book
    ui.randomButton.addEventListener('click', handleRandomBook);

    // Sort functionality
    ui.sortSelect.addEventListener('change', handleSort);

    // Theme toggle
    ui.themeToggle.addEventListener('click', () => ui.toggleTheme());

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            ui.hideModal(button.closest('.modal'));
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            ui.hideModal(e.target);
        }
    });

    // Event delegation for review buttons (since they're created dynamically)
    document.addEventListener('click', (e) => {
        // Add review button
        if (e.target.id === 'add-review' || e.target.closest('#add-review')) {
            e.stopPropagation();
            const bookId = e.target.closest('.book-details')?.dataset.bookId;
            if (bookId) {
                ui.showReviewForm(bookId);
            }
        }
        
        // View reviews button
        if (e.target.id === 'view-reviews' || e.target.closest('#view-reviews')) {
            e.stopPropagation();
            const bookId = e.target.closest('.book-details')?.dataset.bookId;
            if (bookId) {
                ui.showReviews(bookId);
            }
        }
        
        // Test buttons
        if (e.target.id === 'test-add-review') {
            console.log('Test Add Review clicked');
            ui.showReviewForm('test-book-id');
        }
        
        if (e.target.id === 'test-view-reviews') {
            console.log('Test View Reviews clicked');
            ui.showReviews('test-book-id');
        }
    });

    // Handle navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href');
            if (target === '#favorites') {
                showFavorites();
            } else {
                loadInitialBooks();
            }
            // Update active state
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
});

// Show Favorites
function showFavorites() {
    const favorites = storageManager.getFavorites();
    if (favorites.length === 0) {
        ui.showError('No favorite books yet. Add some books to your favorites!');
        ui.clearBooks();
    } else {
        ui.displayBooks(favorites);
    }
}

// Search Handler
async function handleSearch() {
    const query = ui.searchInput.value.trim();
    const genre = ui.genreSelect.value;
    
    if (!query) {
        ui.showError('Please enter a search term');
        return;
    }

    try {
        ui.showLoading();
        let books;
        
        if (genre && genre !== 'all') {
            // Search with genre filter
            books = await bookAPI.searchBooks(query, genre);
            console.log(`Searching for "${query}" in genre "${genre}"`);
        } else {
            // Search without genre filter
            books = await bookAPI.searchBooks(query);
            console.log(`Searching for "${query}" in all genres`);
        }

        if (books.length === 0) {
            if (genre && genre !== 'all') {
                ui.showError(`No books found for "${query}" in the ${genre} genre. Try a different search term or genre.`);
            } else {
                ui.showError(`No books found for "${query}". Try a different search term.`);
            }
        } else {
            ui.displayBooks(books);
            // Show success message
            const message = genre && genre !== 'all' 
                ? `Found ${books.length} books for "${query}" in ${genre}`
                : `Found ${books.length} books for "${query}"`;
            ui.showSuccess(message);
        }
    } catch (error) {
        console.error('Search error:', error);
        ui.showError('Failed to search books. Please try again later.');
    } finally {
        ui.hideLoading();
    }
}

// Random Book Handler
async function handleRandomBook() {
    try {
        ui.showLoading();
        const genre = ui.genreSelect.value;
        const book = await bookAPI.getRandomBook(genre);
        ui.displayBooks([book]);
    } catch (error) {
        ui.showError('Failed to get random book. Please try again later.');
    } finally {
        ui.hideLoading();
    }
}

// Sort Handler
function handleSort() {
    try {
        const sortBy = ui.sortSelect.value;
        const books = Array.from(ui.booksContainer.children).map(card => {
            const publishedDate = card.dataset.publishedDate;
            const rating = card.dataset.rating;
            
            return {
                id: card.dataset.bookId,
                title: card.querySelector('h3').textContent,
                authors: card.querySelector('p').textContent.split(', '),
                coverImage: card.querySelector('img').src,
                averageRating: parseFloat(rating) || 0,
                publishedDate: publishedDate === 'Unknown' ? '1900-01-01' : publishedDate,
                genres: card.dataset.genres ? card.dataset.genres.split(',') : []
            };
        });

        const sortedBooks = ui.sortBooks(books, sortBy);
        ui.displayBooks(sortedBooks);
    } catch (error) {
        console.error('Error in handleSort:', error);
        ui.showError('Error sorting books. Please try again.');
    }
}

// Error Handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ui.showError('An unexpected error occurred. Please try again.');
}); 