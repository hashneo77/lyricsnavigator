// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAmlgzkqPJwo8rOWtGha0y0LsOkCy__INw",
  authDomain: "lyricsreader-9f43d.firebaseapp.com",
  projectId: "lyricsreader-9f43d",
  storageBucket: "lyricsreader-9f43d.firebasestorage.app",
  messagingSenderId: "857705348648",
  appId: "1:857705348648:web:df089fe4effd064fd23f1d",
  databaseURL: "https://lyricsreader-9f43d-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// App version
const APP_VERSION = '1.0.2';

// Global variables
let allSongs = [];
let currentSessionCode = null;
let currentSongId = null;
let favoriteSongs = new Set();
let sessionTimerInterval = null;
let searchDebounceTimer = null;
const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available, show update notification
                            if (confirm('New version available! Reload to update?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });
    });

    // Reload page when new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}

// Load songs from Firebase on page load
window.addEventListener('DOMContentLoaded', () => {
    // Set version in UI
    const versionElement = document.querySelector('.version-number');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    }

    loadFavoritesFromFirebase();
    loadSongsFromFirebase();
    checkExistingSession();

    // Show install prompt for PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Optionally, show your own install button here
        console.log('PWA install prompt available');
    });
});

// Load favorites from Firebase (shared across all users)
function loadFavoritesFromFirebase() {
    const favoritesRef = ref(database, 'sharedFavorites');
    
    onValue(favoritesRef, (snapshot) => {
        const data = snapshot.val();
        favoriteSongs = new Set();
        
        if (data) {
            Object.keys(data).forEach(songId => {
                if (data[songId] === true) {
                    favoriteSongs.add(songId);
                }
            });
        }
        
        // Re-sort and display songs when favorites load
        if (allSongs.length > 0) {
            allSongs.sort((a, b) => {
                const aIsFav = favoriteSongs.has(a.id);
                const bIsFav = favoriteSongs.has(b.id);
                
                if (aIsFav && !bIsFav) return -1;
                if (!aIsFav && bIsFav) return 1;
                
                return a.title.localeCompare(b.title);
            });
            
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            if (searchTerm) {
                searchSongs();
            } else {
                displaySongs(allSongs);
            }
        }
    });
}

// Save favorite to Firebase (shared)
function saveFavoriteToFirebase(songId, isFavorite) {
    const favoriteRef = ref(database, `sharedFavorites/${songId}`);
    set(favoriteRef, isFavorite);
}

// Toggle favorite status
window.toggleFavorite = function(event, songId) {
    event.stopPropagation(); // Prevent triggering song load
    
    const isFavorite = !favoriteSongs.has(songId);
    
    if (isFavorite) {
        favoriteSongs.add(songId);
    } else {
        favoriteSongs.delete(songId);
    }
    
    // Save to Firebase (shared across all users)
    saveFavoriteToFirebase(songId, isFavorite);
    
    // Update the display immediately (Firebase listener will also update)
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (searchTerm) {
        searchSongs();
    } else {
        displaySongs(allSongs);
    }
}

// Load songs from Firebase
function loadSongsFromFirebase() {
    const songsRef = ref(database, 'songs');
    
    onValue(songsRef, (snapshot) => {
        const data = snapshot.val();
        allSongs = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                allSongs.push({
                    id: key,
                    ...data[key]
                });
            });
        }
        
        // Sort songs: favorites first, then alphabetically by title
        allSongs.sort((a, b) => {
            const aIsFav = favoriteSongs.has(a.id);
            const bIsFav = favoriteSongs.has(b.id);
            
            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;
            
            return a.title.localeCompare(b.title);
        });
        
        displaySongs(allSongs);
    }, (error) => {
        console.error("Error loading songs:", error);
        document.getElementById('songList').innerHTML = 
            '<div class="loading">Error loading songs. Please refresh the page.</div>';
    });
}

// Display songs in the list
function displaySongs(songs) {
    const songList = document.getElementById('songList');
    
    if (songs.length === 0) {
        songList.innerHTML = '<div class="no-results">No songs found</div>';
        return;
    }
    
    songList.innerHTML = songs.map(song => {
        const isFavorite = favoriteSongs.has(song.id);
        const starIcon = isFavorite ? '⭐' : '☆';
        
        return `
            <div class="song-item" onclick="loadSong('${song.url}', '${song.id}')" data-id="${song.id}">
                <div class="song-content">
                    <div>
                        <div class="song-title">${escapeHtml(song.title)}</div>
                        <div class="song-artist">${escapeHtml(song.artist)}</div>
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite(event, '${song.id}')"
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${starIcon}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function fuzzyMatch(text, word) {
    let tIndex = 0;
    let wIndex = 0;

    while (tIndex < text.length && wIndex < word.length) {
        if (text[tIndex] === word[wIndex]) {
            wIndex++;
        }
        tIndex++;
    }

    return wIndex === word.length;
}

// Load song in iframe
window.loadSong = function(url, songId) {
    const iframe = document.getElementById('songFrame');
    const placeholder = document.getElementById('placeholder');
    
    iframe.src = url;
    iframe.classList.add('active');
    placeholder.classList.add('hidden');
    
    // Update active state
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-id="${songId}"]`)?.classList.add('active');
    
    currentSongId = songId;
    
    // Sync with session if active
    if (currentSessionCode) {
        syncSongToSession(url, songId);
    }
}

// Debounced search function
window.searchSongs = function () {
    // Clear previous timer
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    // Set new timer - search will run 300ms after user stops typing
    searchDebounceTimer = setTimeout(() => {
        performSearch();
    }, 300);
}

// Actual search logic
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value
        .toLowerCase()
        .trim();

    if (!searchTerm) {
        displaySongs(allSongs);
        return;
    }

    const searchWords = searchTerm.split(/\s+/);

    const scoredSongs = allSongs.map(song => {
        let score = 0;

        const title = song.title.toLowerCase();
        const artist = song.artist.toLowerCase();

        searchWords.forEach(word => {
            // Exact word match (highest priority)
            if (title.includes(word)) score += 5;
            if (artist.includes(word)) score += 3;

            // Starts with match
            if (title.startsWith(word)) score += 4;
            if (artist.startsWith(word)) score += 2;

            // Fuzzy match (handles small typos)
            if (fuzzyMatch(title, word)) score += 2;
            if (fuzzyMatch(artist, word)) score += 1;
        });

        // Boost score for favorites
        if (favoriteSongs.has(song.id)) {
            score += 10;
        }

        return { ...song, score };
    });

    const filteredSongs = scoredSongs
        .filter(song => song.score > 0)
        .sort((a, b) => {
            // If scores are equal, prioritize favorites
            if (b.score === a.score) {
                const aIsFav = favoriteSongs.has(a.id);
                const bIsFav = favoriteSongs.has(b.id);
                if (aIsFav && !bIsFav) return -1;
                if (!aIsFav && bIsFav) return 1;
            }
            return b.score - a.score;
        });

    displaySongs(filteredSongs);
}


window.toggleFullscreen = function () {
    const container = document.querySelector('.iframe-container');

    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            alert(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}


// ===== Session Management =====

window.createSession = function() {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const createdAt = Date.now();

    currentSessionCode = code;
    localStorage.setItem('sessionCode', code);
    localStorage.setItem('sessionCreatedAt', createdAt);

    // Create session in Firebase with expiry time
    const sessionRef = ref(database, `sessions/${code}`);
    set(sessionRef, {
        createdAt: createdAt,
        expiresAt: createdAt + SESSION_DURATION,
        currentSong: null
    });

    updateSessionStatus(`Session Created: ${code}`);
    startSessionTimer(createdAt);

    // Schedule session deletion after 6 hours
    scheduleSessionDeletion(code, SESSION_DURATION);

    // Listen for session changes
    listenToSession(code);
}

window.joinSession = function() {
    const code = document.getElementById('sessionInput').value.trim();

    if (!code) {
        alert('Please enter a session code');
        return;
    }

    if (!/^\d{4}$/.test(code)) {
        alert('Please enter a valid 4-digit code');
        return;
    }

    // Check if session exists and is not expired
    const sessionRef = ref(database, `sessions/${code}`);
    onValue(sessionRef, (snapshot) => {
        const sessionData = snapshot.val();

        if (!sessionData) {
            alert('Session not found. Please check the code.');
            return;
        }

        const now = Date.now();
        if (sessionData.expiresAt && now > sessionData.expiresAt) {
            alert('This session has expired.');
            // Delete expired session
            remove(sessionRef);
            return;
        }

        currentSessionCode = code;
        localStorage.setItem('sessionCode', code);
        localStorage.setItem('sessionCreatedAt', sessionData.createdAt);

        updateSessionStatus(`Joined Session: ${code}`);
        startSessionTimer(sessionData.createdAt);

        // Listen for session changes
        listenToSession(code);
    }, { onlyOnce: true });
}

function checkExistingSession() {
    const savedCode = localStorage.getItem('sessionCode');
    const savedCreatedAt = localStorage.getItem('sessionCreatedAt');

    if (savedCode && savedCreatedAt) {
        const createdAt = parseInt(savedCreatedAt);
        const now = Date.now();

        // Check if session is expired
        if (now - createdAt > SESSION_DURATION) {
            // Session expired, clear it
            endSession();
            return;
        }

        // Check if session still exists in Firebase
        const sessionRef = ref(database, `sessions/${savedCode}`);
        onValue(sessionRef, (snapshot) => {
            const sessionData = snapshot.val();

            if (!sessionData) {
                // Session doesn't exist in DB, clear local storage
                endSession();
                return;
            }

            currentSessionCode = savedCode;
            updateSessionStatus(`Active Session: ${savedCode}`);
            startSessionTimer(createdAt);
            listenToSession(savedCode);
        }, { onlyOnce: true });
    }
}

function updateSessionStatus(message) {
    const statusDiv = document.getElementById('sessionStatus');
    const codeText = statusDiv.querySelector('.session-code-text');
    const endBtn = document.getElementById('endSessionBtn');

    if (codeText) {
        codeText.textContent = message;
    }

    statusDiv.classList.add('active');

    // Show end session button
    if (endBtn) {
        endBtn.style.display = 'inline-flex';
    }
}

function startSessionTimer(createdAt) {
    // Clear any existing timer
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
    }

    const updateTimer = () => {
        const now = Date.now();
        const elapsed = now - createdAt;
        const remaining = SESSION_DURATION - elapsed;

        if (remaining <= 0) {
            endSession();
            return;
        }

        // Format time as HH:MM:SS
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

        const timeString = `${hours}h ${minutes}m ${seconds}s remaining`;
        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            timerElement.textContent = timeString;
        }
    };

    // Update immediately
    updateTimer();

    // Update every second
    sessionTimerInterval = setInterval(updateTimer, 1000);
}

function scheduleSessionDeletion(code, duration) {
    setTimeout(() => {
        const sessionRef = ref(database, `sessions/${code}`);
        remove(sessionRef);

        // If this is the current session, end it
        if (currentSessionCode === code) {
            endSession();
        }
    }, duration);
}

function endSession() {
    // Clear timer
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }

    // Delete session from Firebase if it exists
    if (currentSessionCode) {
        const sessionRef = ref(database, `sessions/${currentSessionCode}`);
        remove(sessionRef);
    }

    // Clear local storage
    localStorage.removeItem('sessionCode');
    localStorage.removeItem('sessionCreatedAt');

    // Clear current session
    currentSessionCode = null;

    // Update UI
    const statusDiv = document.getElementById('sessionStatus');
    const codeText = statusDiv.querySelector('.session-code-text');
    const timerSpan = document.getElementById('sessionTimer');
    const endBtn = document.getElementById('endSessionBtn');

    if (codeText) {
        codeText.textContent = 'Session ended';
    }
    if (timerSpan) {
        timerSpan.textContent = '';
    }
    if (endBtn) {
        endBtn.style.display = 'none';
    }

    statusDiv.classList.add('active');

    // Hide status after 3 seconds
    setTimeout(() => {
        statusDiv.classList.remove('active');
    }, 3000);
}

window.endSession = endSession;

function listenToSession(code) {
    const sessionRef = ref(database, `sessions/${code}/currentSong`);
    
    onValue(sessionRef, (snapshot) => {
        const songData = snapshot.val();
        if (songData && songData.songId !== currentSongId) {
            // Load the song that was shared in the session
            loadSong(songData.url, songData.songId);
        }
    });
}

function syncSongToSession(url, songId) {
    if (!currentSessionCode) return;
    
    const sessionRef = ref(database, `sessions/${currentSessionCode}/currentSong`);
    set(sessionRef, {
        url: url,
        songId: songId,
        timestamp: Date.now()
    });
}

// ===== Add Song Modal =====

window.showAddSongModal = function() {
    document.getElementById('addSongModal').classList.add('active');
}

window.closeAddSongModal = function() {
    document.getElementById('addSongModal').classList.remove('active');
    document.getElementById('songTitle').value = '';
    document.getElementById('songArtist').value = '';
    document.getElementById('songUrl').value = '';
}

window.addNewSong = function(event) {
    event.preventDefault();
    
    const title = document.getElementById('songTitle').value;
    const artist = document.getElementById('songArtist').value;
    const url = document.getElementById('songUrl').value;
    
    // Add to Firebase
    const songsRef = ref(database, 'songs');
    const newSongRef = push(songsRef);
    
    set(newSongRef, {
        title: title,
        artist: artist,
        url: url,
        addedAt: Date.now()
    }).then(() => {
        alert('Song added successfully!');
        closeAddSongModal();
    }).catch((error) => {
        alert('Error adding song: ' + error.message);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addSongModal');
    if (event.target === modal) {
        closeAddSongModal();
    }
}