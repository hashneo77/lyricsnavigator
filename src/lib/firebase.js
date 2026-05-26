import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAmlgzkqPJwo8rOWtGha0y0LsOkCy__INw',
  authDomain: 'lyricsreader-9f43d.firebaseapp.com',
  projectId: 'lyricsreader-9f43d',
  storageBucket: 'lyricsreader-9f43d.firebasestorage.app',
  messagingSenderId: '857705348648',
  appId: '1:857705348648:web:df089fe4effd064fd23f1d',
  databaseURL: 'https://lyricsreader-9f43d-default-rtdb.europe-west1.firebasedatabase.app/',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
