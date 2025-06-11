class BookAPI {
    constructor() {
        this.baseUrl = 'https://www.googleapis.com/books/v1/volumes';
        this.fictionalAuthors = [
            'Isabella Martínez',
            'James Chen',
            'Sophia Patel',
            'Marcus Johnson',
            'Aisha Rahman',
            'Carlos Rodriguez',
            'Emma Thompson',
            'Lucas Kim',
            'Olivia Santos',
            'Noah Williams',
            'Maya Patel',
            'Ethan Chang',
            'Ava O\'Connor',
            'Liam Garcia',
            'Zoe Anderson',
            'Benjamin Lee',
            'Charlotte Wong',
            'Daniel Silva',
            'Victoria Chen',
            'Alexander Morgan'
        ];
        this.genres = [
            'Fiction',
            'Mystery',
            'Science Fiction',
            'Fantasy',
            'Romance',
            'Thriller',
            'Biography',
            'History',
            'Philosophy',
            'Poetry',
            'Science',
            'Technology',
            'Business',
            'Self-Help',
            'Cooking',
            'Travel',
            'Art',
            'Music',
            'Sports',
            'Education'
        ];
    }

    async searchBooks(query, genre = '') {
        try {
            let searchQuery = query;
            if (genre) {
                searchQuery = `${query} subject:${genre.toLowerCase()}`;
            }
            
            const response = await fetch(`${this.baseUrl}?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            
            if (!data.items) {
                return [];
            }

            return data.items.map(item => this.formatBookData(item));
        } catch (error) {
            console.error('Error searching books:', error);
            throw new Error('Failed to search books. Please try again later.');
        }
    }

    async getRandomBook(genre = '') {
        try {
            const searchQuery = genre ? 
                `subject:${genre.toLowerCase()}` : 
                this.getRandomSearchTerm();
                
            const response = await fetch(`${this.baseUrl}?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                throw new Error('No books found. Please try again.');
            }

            const randomIndex = Math.floor(Math.random() * data.items.length);
            return this.formatBookData(data.items[randomIndex]);
        } catch (error) {
            console.error('Error getting random book:', error);
            throw new Error('Failed to get random book. Please try again later.');
        }
    }

    formatBookData(item) {
        const volumeInfo = item.volumeInfo;
        const authors = volumeInfo.authors || [this.getRandomAuthor()];
        const categories = volumeInfo.categories || [];
        
        // Extract genres from categories
        const genres = categories.map(category => {
            // Split category by '/' and take the first part
            const mainCategory = category.split('/')[0].trim();
            // Capitalize first letter of each word
            return mainCategory.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        });

        // If no genres found, assign a random one
        if (genres.length === 0) {
            genres.push(this.getRandomGenre());
        }

        return {
            id: item.id,
            title: volumeInfo.title || 'Untitled',
            authors: authors,
            description: volumeInfo.description || 'No description available.',
            coverImage: volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover',
            averageRating: volumeInfo.averageRating || 0,
            publishedDate: volumeInfo.publishedDate || 'Unknown',
            genres: genres,
            pageCount: volumeInfo.pageCount || 0,
            language: volumeInfo.language || 'en'
        };
    }

    getRandomAuthor() {
        const randomIndex = Math.floor(Math.random() * this.fictionalAuthors.length);
        return this.fictionalAuthors[randomIndex];
    }

    getRandomGenre() {
        const randomIndex = Math.floor(Math.random() * this.genres.length);
        return this.genres[randomIndex];
    }

    getRandomSearchTerm() {
        const searchTerms = this.genres.map(genre => genre.toLowerCase());
        const randomIndex = Math.floor(Math.random() * searchTerms.length);
        return searchTerms[randomIndex];
    }

    getGenres() {
        return this.genres;
    }

    async getBookDetails(bookId) {
        try {
            const response = await fetch(`${this.baseUrl}/${bookId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch book details');
            }

            const data = await response.json();
            return this.processBookData([data])[0];
        } catch (error) {
            console.error('Error getting book details:', error);
            throw error;
        }
    }

    processBookData(books) {
        return books.map(book => {
            const volumeInfo = book.volumeInfo;
            return {
                id: book.id,
                title: volumeInfo.title || 'Unknown Title',
                authors: volumeInfo.authors || ['Unknown Author'],
                description: volumeInfo.description || 'No description available',
                coverImage: volumeInfo.imageLinks?.thumbnail || 'images/no-cover.png',
                publishedDate: volumeInfo.publishedDate || 'Unknown Date',
                publisher: volumeInfo.publisher || 'Unknown Publisher',
                genres: volumeInfo.categories || [],
                averageRating: volumeInfo.averageRating || 0,
                ratingsCount: volumeInfo.ratingsCount || 0,
                previewLink: volumeInfo.previewLink || '#'
            };
        });
    }
} 