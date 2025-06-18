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
        this.openLibraryAPI = new OpenLibraryAPI();
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
            // Try multiple search strategies to get a random book
            const searchStrategies = [];
            
            if (genre && genre !== 'all') {
                searchStrategies.push(`subject:${genre.toLowerCase()}`);
            }
            
            // Add some popular search terms as fallbacks
            searchStrategies.push('bestseller');
            searchStrategies.push('popular books');
            searchStrategies.push('fiction');
            searchStrategies.push('nonfiction');
            
            // Try each strategy until we find books
            for (const searchQuery of searchStrategies) {
                try {
                    const response = await fetch(`${this.baseUrl}?q=${encodeURIComponent(searchQuery)}&maxResults=40`);
                    const data = await response.json();
                    
                    if (data.items && data.items.length > 0) {
                        // Filter out books without covers
                        const booksWithCovers = data.items.filter(item => 
                            item.volumeInfo && 
                            item.volumeInfo.imageLinks && 
                            item.volumeInfo.imageLinks.thumbnail
                        );
                        
                        if (booksWithCovers.length > 0) {
                            const randomIndex = Math.floor(Math.random() * booksWithCovers.length);
                            return this.formatBookData(booksWithCovers[randomIndex]);
                        }
                    }
                } catch (strategyError) {
                    console.log(`Strategy failed for: ${searchQuery}`, strategyError);
                    continue;
                }
            }
            
            // If all strategies fail, try one more time with any books
            const fallbackResponse = await fetch(`${this.baseUrl}?q=books&maxResults=20`);
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.items && fallbackData.items.length > 0) {
                const randomIndex = Math.floor(Math.random() * fallbackData.items.length);
                return this.formatBookData(fallbackData.items[randomIndex]);
            }
            
            throw new Error('No books found with any search strategy');
            
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

        // Better image handling with multiple fallbacks
        let coverImage = 'https://via.placeholder.com/128x192?text=Book+Cover';
        if (volumeInfo.imageLinks) {
            // Try different image sizes in order of preference
            coverImage = volumeInfo.imageLinks.thumbnail || 
                        volumeInfo.imageLinks.smallThumbnail || 
                        volumeInfo.imageLinks.small || 
                        volumeInfo.imageLinks.medium || 
                        volumeInfo.imageLinks.large ||
                        'https://via.placeholder.com/128x192?text=Book+Cover';
        }

        // Ensure the image URL is valid
        if (!coverImage || coverImage === 'https://via.placeholder.com/128x192?text=No+Cover') {
            coverImage = 'https://via.placeholder.com/128x192?text=Book+Cover';
        }

        return {
            id: item.id,
            title: volumeInfo.title || 'Untitled',
            authors: authors,
            description: volumeInfo.description || 'No description available.',
            coverImage: coverImage,
            averageRating: volumeInfo.averageRating || 0,
            publishedDate: volumeInfo.publishedDate || 'Unknown',
            genres: genres,
            pageCount: volumeInfo.pageCount || 0,
            language: volumeInfo.language || 'en',
            publisher: volumeInfo.publisher || 'Unknown',
            isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || null
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

    async getEnhancedBookDetails(bookId) {
        try {
            // Get data from Google Books API
            const googleBookData = await this.getBookDetails(bookId);
            
            // Try to get ISBN from Google Books data
            const isbn = googleBookData.isbn || 
                        googleBookData.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
                        googleBookData.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;

            let openLibraryData = null;
            if (isbn) {
                // Get additional data from Open Library
                openLibraryData = await this.openLibraryAPI.getBookDetails(isbn);
            }

            // Combine data from both APIs
            return {
                ...googleBookData,
                openLibrary: openLibraryData,
                enhancedCover: isbn ? this.openLibraryAPI.getCoverUrl(isbn, 'L') : null,
                hasOpenLibraryData: !!openLibraryData
            };
        } catch (error) {
            console.error('Error getting enhanced book details:', error);
            throw error;
        }
    }

    async getAuthorEnhancedDetails(authorName) {
        try {
            // First try to get author ID from Open Library
            const searchResponse = await fetch(`${this.openLibraryAPI.baseUrl}/search/authors.json?q=${encodeURIComponent(authorName)}`);
            const searchData = await searchResponse.json();
            
            if (searchData.docs && searchData.docs.length > 0) {
                const authorId = searchData.docs[0].key;
                return await this.openLibraryAPI.getAuthorDetails(authorId);
            }
            return null;
        } catch (error) {
            console.error('Error getting author details:', error);
            return null;
        }
    }

    async getBookRecommendations(bookId) {
        try {
            const book = await this.getBookDetails(bookId);
            const genre = book.genres[0];
            const author = book.authors[0];
            
            // Get recommendations based on genre and author
            const genreResponse = await fetch(`${this.baseUrl}?q=subject:${genre}&maxResults=5`);
            const authorResponse = await fetch(`${this.baseUrl}?q=inauthor:${author}&maxResults=5`);
            
            const [genreData, authorData] = await Promise.all([
                genreResponse.json(),
                authorResponse.json()
            ]);

            return {
                byGenre: genreData.items?.map(item => this.formatBookData(item)) || [],
                byAuthor: authorData.items?.map(item => this.formatBookData(item)) || []
            };
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return null;
        }
    }

    async getBookSeries(bookId) {
        try {
            const book = await this.getBookDetails(bookId);
            const seriesQuery = book.title.split(':')[0]; // Try to extract series name
            const response = await fetch(`${this.baseUrl}?q="${seriesQuery}"&maxResults=10`);
            const data = await response.json();
            
            return data.items
                ?.filter(item => item.volumeInfo.title.includes(seriesQuery))
                .map(item => this.formatBookData(item)) || [];
        } catch (error) {
            console.error('Error getting series:', error);
            return null;
        }
    }

    async getBookReviews(bookId) {
        try {
            const response = await fetch(`${this.baseUrl}/${bookId}/userreviews`);
            if (!response.ok) throw new Error('Reviews not found');
            const data = await response.json();
            return data.items?.map(review => ({
                author: review.author.displayName,
                rating: review.rating,
                content: review.content,
                date: review.date,
                helpful: review.helpful
            })) || [];
        } catch (error) {
            console.error('Error getting reviews:', error);
            return null;
        }
    }
}

class OpenLibraryAPI {
    constructor() {
        this.baseUrl = 'https://openlibrary.org';
        this.coversUrl = 'https://covers.openlibrary.org/b';
        this.worksUrl = 'https://openlibrary.org/works';
    }

    async getBookDetails(isbn) {
        try {
            const response = await fetch(`${this.baseUrl}/isbn/${isbn}.json`);
            if (!response.ok) {
                throw new Error('Book not found in Open Library');
            }
            const data = await response.json();
            return this.formatBookData(data);
        } catch (error) {
            console.error('Error fetching from Open Library:', error);
            return null;
        }
    }

    async getAuthorDetails(authorId) {
        try {
            const response = await fetch(`${this.baseUrl}${authorId}.json`);
            if (!response.ok) {
                throw new Error('Author not found in Open Library');
            }
            const data = await response.json();
            return {
                name: data.name,
                bio: data.bio?.value || 'No biography available',
                birthDate: data.birth_date,
                deathDate: data.death_date,
                works: data.works || []
            };
        } catch (error) {
            console.error('Error fetching author details:', error);
            return null;
        }
    }

    getCoverUrl(isbn, size = 'M') {
        // Size can be S (small), M (medium), L (large)
        return `${this.coversUrl}/isbn/${isbn}-${size}.jpg`;
    }

    formatBookData(data) {
        return {
            openLibraryId: data.key,
            title: data.title,
            authors: data.authors ? data.authors.map(author => author.key) : [],
            publishDate: data.publish_date,
            publishers: data.publishers || [],
            numberOfPages: data.number_of_pages,
            subjects: data.subjects || [],
            isbn: data.isbn_13?.[0] || data.isbn_10?.[0],
            coverId: data.covers?.[0],
            description: data.description?.value || 'No description available',
            firstSentence: data.first_sentence?.value,
            languages: data.languages || []
        };
    }

    async getBookWorks(workId) {
        try {
            const response = await fetch(`${this.worksUrl}/${workId}.json`);
            if (!response.ok) throw new Error('Work not found');
            const data = await response.json();
            return {
                title: data.title,
                description: data.description?.value,
                subjects: data.subjects || [],
                excerpts: data.excerpts || [],
                firstPublishDate: data.first_publish_date,
                covers: data.covers || [],
                authors: data.authors || []
            };
        } catch (error) {
            console.error('Error fetching work details:', error);
            return null;
        }
    }

    async getAuthorWorks(authorId) {
        try {
            const response = await fetch(`${this.baseUrl}/authors/${authorId}/works.json`);
            if (!response.ok) throw new Error('Author works not found');
            const data = await response.json();
            return data.entries.map(work => ({
                title: work.title,
                key: work.key,
                type: work.type,
                subjects: work.subjects || []
            }));
        } catch (error) {
            console.error('Error fetching author works:', error);
            return null;
        }
    }

    async getBookEditions(isbn) {
        try {
            const response = await fetch(`${this.baseUrl}/isbn/${isbn}/editions.json`);
            if (!response.ok) throw new Error('Editions not found');
            const data = await response.json();
            return data.entries.map(edition => ({
                title: edition.title,
                publishDate: edition.publish_date,
                publishers: edition.publishers || [],
                languages: edition.languages || [],
                coverId: edition.covers?.[0]
            }));
        } catch (error) {
            console.error('Error fetching editions:', error);
            return null;
        }
    }
} 