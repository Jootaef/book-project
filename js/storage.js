class StorageManager {
    constructor() {
        this.favoritesKey = 'bookFavorites';
        this.reviewsKey = 'bookReviews';
        this.themeKey = 'preferredTheme';
    }

    // Favorites Management
    getFavorites() {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    }

    addToFavorites(book) {
        const favorites = this.getFavorites();
        if (!favorites.some(fav => fav.id === book.id)) {
            favorites.push(book);
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }

    removeFromFavorites(bookId) {
        const favorites = this.getFavorites();
        const updatedFavorites = favorites.filter(book => book.id !== bookId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
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
        return localStorage.getItem('theme') || 'light';
    }

    setTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // Search History
    addSearchHistory(query) {
        const history = this.getSearchHistory();
        if (!history.includes(query)) {
            history.unshift(query);
            if (history.length > 10) {
                history.pop();
            }
            localStorage.setItem('searchHistory', JSON.stringify(history));
        }
    }

    getSearchHistory() {
        const history = localStorage.getItem('searchHistory');
        return history ? JSON.parse(history) : [];
    }

    clearSearchHistory() {
        localStorage.removeItem('searchHistory');
    }

    // Clear All Data
    clearAllData() {
        localStorage.removeItem(this.favoritesKey);
        localStorage.removeItem(this.reviewsKey);
        localStorage.removeItem(this.themeKey);
    }
} 