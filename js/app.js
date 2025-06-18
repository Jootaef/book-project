// Initialize API and Storage
const bookAPI = new BookAPI();
const storageManager = new StorageManager();
const ui = new UI();

// Initialize theme with better error handling
function initializeTheme() {
    try {
        console.log('=== Initializing Theme ===');
        
        // Get saved theme from storage
        const savedTheme = storageManager.getTheme();
        console.log('Saved theme from storage:', savedTheme);
        
        // Apply theme to body
        document.body.setAttribute('data-theme', savedTheme);
        console.log('Theme applied to body:', document.body.getAttribute('data-theme'));
        
        // Update toggle button icon
        if (ui.themeToggle) {
            ui.themeToggle.innerHTML = savedTheme === 'dark' ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
            console.log('Theme toggle button updated');
        } else {
            console.warn('Theme toggle button not found during initialization');
        }
        
        console.log('=== Theme Initialization Complete ===');
        
    } catch (error) {
        console.error('Error initializing theme:', error);
        // Fallback to light theme
        try {
            document.body.setAttribute('data-theme', 'light');
            if (ui.themeToggle) {
                ui.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
            console.log('Fallback theme applied: light');
        } catch (fallbackError) {
            console.error('Fallback theme also failed:', fallbackError);
        }
    }
}

// Load initial books when the page loads
async function loadInitialBooks() {
    try {
        ui.showLoading();
        const books = await bookAPI.searchBooks('popular books');
        ui.displayBooks(books);
    } catch (error) {
        console.error('API Error:', error);
        // Use fallback books if API fails
        const fallbackBooks = bookAPI.getFallbackBooks();
        ui.displayBooks(fallbackBooks);
        ui.showError('Using sample books (API temporarily unavailable). Try searching for specific books.');
    } finally {
        ui.hideLoading();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme after DOM is ready
    initializeTheme();
    
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

    // Theme toggle is handled in UI class, no need to duplicate here

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

    // Test modal functionality
    const testModalBtn = document.getElementById('test-modal');
    if (testModalBtn) {
        testModalBtn.addEventListener('click', () => {
            console.log('Test modal button clicked');
            const testBook = {
                id: 'test-book-1',
                title: 'Test Book Title',
                authors: ['Test Author'],
                description: 'This is a test book description to verify the modal is working properly.',
                coverImage: 'https://via.placeholder.com/200x300?text=Test+Book',
                averageRating: 4.5,
                genres: ['Fiction', 'Test'],
                publishedDate: '2024-01-01'
            };
            ui.showBookDetails(testBook);
        });
    }
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
            console.log(`Found ${books.length} books for "${query}"`);
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
        
        // Try to get a random book
        let book;
        try {
            book = await bookAPI.getRandomBook(genre);
        } catch (apiError) {
            console.error('API error for random book:', apiError);
            // Fallback: search for popular books and pick one randomly
            const fallbackBooks = await bookAPI.searchBooks('popular books');
            if (fallbackBooks.length > 0) {
                const randomIndex = Math.floor(Math.random() * fallbackBooks.length);
                book = fallbackBooks[randomIndex];
            } else {
                throw new Error('No books available');
            }
        }
        
        // Ensure the book has a valid image
        if (!book.coverImage || book.coverImage.includes('placeholder')) {
            book.coverImage = 'https://via.placeholder.com/128x192?text=Book+Cover';
        }
        
        // Display the book
        ui.displayBooks([book]);
        console.log('Random book displayed:', book.title);
        
    } catch (error) {
        console.error('Error in handleRandomBook:', error);
        ui.showError('Failed to get random book. Please try again later.');
        // Try to load initial books as fallback
        await loadInitialBooks();
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