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

// Global variables
let allSongs = [];
let currentSessionCode = null;
let currentSongId = null;
let favoriteSongs = new Set();

// Load songs from Firebase on page load
window.addEventListener('DOMContentLoaded', () => {
    loadFavoritesFromLocalStorage();
    loadSongsFromFirebase();
    checkExistingSession();
});

// Load favorites from localStorage
function loadFavoritesFromLocalStorage() {
    const savedFavorites = localStorage.getItem('favoriteSongs');
    if (savedFavorites) {
        favoriteSongs = new Set(JSON.parse(savedFavorites));
    }
}

// Save favorites to localStorage
function saveFavoritesToLocalStorage() {
    localStorage.setItem('favoriteSongs', JSON.stringify([...favoriteSongs]));
}

// Toggle favorite status
window.toggleFavorite = function(event, songId) {
    event.stopPropagation(); // Prevent triggering song load
    
    if (favoriteSongs.has(songId)) {
        favoriteSongs.delete(songId);
    } else {
        favoriteSongs.add(songId);
    }
    
    saveFavoritesToLocalStorage();
    
    // Update the display
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

// Search songs
window.searchSongs = function () {
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
};


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
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    currentSessionCode = code;
    localStorage.setItem('sessionCode', code);
    
    // Create session in Firebase
    const sessionRef = ref(database, `sessions/${code}`);
    set(sessionRef, {
        createdAt: Date.now(),
        currentSong: null
    });
    
    updateSessionStatus(`Session Created: ${code}`);
    
    // Listen for session changes
    listenToSession(code);
}

window.joinSession = function() {
    const code = document.getElementById('sessionInput').value.toUpperCase();
    
    if (!code) {
        alert('Please enter a session code');
        return;
    }
    
    currentSessionCode = code;
    localStorage.setItem('sessionCode', code);
    
    updateSessionStatus(`Joined Session: ${code}`);
    
    // Listen for session changes
    listenToSession(code);
}

function checkExistingSession() {
    const savedCode = localStorage.getItem('sessionCode');
    if (savedCode) {
        currentSessionCode = savedCode;
        updateSessionStatus(`Active Session: ${savedCode}`);
        listenToSession(savedCode);
    }
}

function updateSessionStatus(message) {
    const statusDiv = document.getElementById('sessionStatus');
    statusDiv.textContent = message;
    statusDiv.classList.add('active');
}

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