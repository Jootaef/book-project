class StorageManager {
    constructor() {
        this.favoritesKey = 'bookFavorites';
        this.reviewsKey = 'bookReviews';
        this.themeKey = 'preferredTheme';
    }

    // Favorites Management
    getFavorites() {
        const favorites = localStorage.getItem(this.favoritesKey);
        return favorites ? JSON.parse(favorites) : [];
    }

    addToFavorites(book) {
        const favorites = this.getFavorites();
        if (!favorites.some(fav => fav.id === book.id)) {
            favorites.push(book);
            localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        }
    }

    removeFromFavorites(bookId) {
        const favorites = this.getFavorites();
        const updatedFavorites = favorites.filter(book => book.id !== bookId);
        localStorage.setItem(this.favoritesKey, JSON.stringify(updatedFavorites));
    }

    isFavorite(bookId) {
        const favorites = this.getFavorites();
        return favorites.some(book => book.id === bookId);
    }

    // Reviews Management
    getReviews(bookId) {
        const allReviews = localStorage.getItem(this.reviewsKey);
        const reviews = allReviews ? JSON.parse(allReviews) : {};
        return reviews[bookId] || [];
    }

    addReview(bookId, review) {
        const allReviews = localStorage.getItem(this.reviewsKey);
        const reviews = allReviews ? JSON.parse(allReviews) : {};
        
        if (!reviews[bookId]) {
            reviews[bookId] = [];
        }
        
        reviews[bookId].push({
            ...review,
            date: new Date().toISOString()
        });
        
        localStorage.setItem(this.reviewsKey, JSON.stringify(reviews));
    }

    getAverageRating(bookId) {
        const reviews = this.getReviews(bookId);
        if (reviews.length === 0) return 0;
        
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    }

    // Theme Management
    getTheme() {
        return localStorage.getItem(this.themeKey) || 'light';
    }

    setTheme(theme) {
        localStorage.setItem(this.themeKey, theme);
    }

    // Search History
    getSearchHistory() {
        const history = localStorage.getItem('bookDiscovery_searchHistory');
        return history ? JSON.parse(history) : [];
    }

    addToSearchHistory(query) {
        const history = this.getSearchHistory();
        // Remove if exists and add to front
        const filteredHistory = history.filter(item => item !== query);
        filteredHistory.unshift(query);
        // Keep only last 10 searches
        const trimmedHistory = filteredHistory.slice(0, 10);
        localStorage.setItem('bookDiscovery_searchHistory', JSON.stringify(trimmedHistory));
    }

    clearSearchHistory() {
        localStorage.removeItem('bookDiscovery_searchHistory');
    }

    // Clear All Data
    clearAllData() {
        localStorage.removeItem(this.favoritesKey);
        localStorage.removeItem(this.reviewsKey);
        localStorage.removeItem(this.themeKey);
    }
} 