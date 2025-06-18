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
        ui.showError('Failed to load initial books. Please try again later.');
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
        } else {
            // Search without genre filter
            books = await bookAPI.searchBooks(query);
        }

        if (books.length === 0) {
            ui.showError('No books found. Try a different search term or genre.');
        } else {
            ui.displayBooks(books);
        }
    } catch (error) {
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
    const sortBy = ui.sortSelect.value;
    const books = Array.from(ui.booksContainer.children).map(card => ({
        id: card.dataset.bookId,
        title: card.querySelector('h3').textContent,
        authors: card.querySelector('p').textContent.split(', '),
        coverImage: card.querySelector('img').src,
        averageRating: parseFloat(card.dataset.rating),
        publishedDate: card.dataset.publishedDate,
        genres: card.dataset.genres.split(',')
    }));

    const sortedBooks = ui.sortBooks(books, sortBy);
    ui.displayBooks(sortedBooks);
}

// Error Handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ui.showError('An unexpected error occurred. Please try again.');
}); 