# BINGO-peli

Yksinkertainen BINGO-peli toteutettuna React + Firebase -teknologioilla. Sovellus tukee Google- ja sähköpostikirjautumista sekä kolmea käyttäjätasoa: Admin, Pitäjä ja Pelaaja.

## Ominaisuudet

### 🎮 Pelaaja
- Liity käynnissä oleviin peleihin
- Saat 1-5 BINGO-ruudukkoa peliin
- Selaa ruudukoita swipe-toiminnolla (mobiili)
- Merkitse huudetut numerot ruudukkoon
- Ilmoita voitto pelin pitäjälle ruudukon tunnisteella

### 🎯 Pitäjä (Host)
- Luo uusia BINGO-pelejä
- Määrittele pelin säännöt:
  - Keskimmäinen ruutu annettu/ei annettu
  - Voittotavat: suora linja, kulmat, koko ruudukko
- Arvo palloja (75 palloa: B 1-15, I 16-30, N 31-45, G 46-60, O 61-75)
- Näe arvotut pallot järjestyksessä
- Tarkista pelaajan ruudukko voiton varmistamiseksi

### ⚙️ Admin
- Hallitse käyttäjien rooleja
- Ylennä käyttäjiä pitäjiksi
- Täydet oikeudet kaikkiin toimintoihin

## Teknologiat

- **Frontend**: React 19 + Vite
- **Backend**: Firebase
  - Authentication (Google & Email/Password)
  - Firestore Database
- **Styling**: Mobile-first CSS
- **Kieli**: JavaScript (ES6+)

## Asennus ja käyttöönotto

### 1. Kloonaa projekti

```bash
cd bingo
npm install
```

### 2. Luo Firebase-projekti

1. Mene osoitteeseen [Firebase Console](https://console.firebase.google.com/)
2. Luo uusi projekti
3. Ota käyttöön Authentication:
   - Valitse **Email/Password**
   - Valitse **Google**
4. Luo Firestore Database:
   - Aloita **test mode** -tilassa kehitystä varten
   - Tuotannossa muista asettaa oikeat säännöt

### 3. Konfiguroi Firebase

Kopioi `.env.example` tiedosto nimelle `.env`:

```bash
cp .env.example .env
```

Muokkaa `.env` tiedostoa ja korvaa Firebase-projektin tiedot:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Löydät nämä tiedot Firebase Consolesta: **Project Settings** → **Your apps** → **Web app**

**HUOM:** `.env` tiedosto ei tallennu Gitiin, joten se on turvallinen paikka API-avaimille.

### 4. Firestore-tietokannan rakenne

Sovellus luo automaattisesti seuraavat kokoelmat:

#### `users` (käyttäjät)
```
users/{userId}
  - email: string
  - displayName: string
  - role: "pelaaja" | "pitäjä" | "admin"
  - createdAt: timestamp
```

#### `games` (pelit)
```
games/{gameId}
  - name: string
  - hostId: string
  - hostName: string
  - centerFree: boolean
  - winConditions: {
      straightLine: boolean,
      corners: boolean,
      fullCard: boolean
    }
  - status: "waiting" | "active" | "finished"
  - calledBalls: array (esim. ["B-7", "I-23", "N-35"])
  - createdAt: timestamp
  - maxCards: number

  cards/{cardId}
    - id: string
    - cells: array
    - assigned: boolean
    - assignedTo: string | null
```

### 5. Firestore Security Rules (Suositellut tuotantoon)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Käyttäjät
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Pelit
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['pitäjä', 'admin'];
      allow update: if request.auth != null &&
                       (resource.data.hostId == request.auth.uid ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      match /cards/{cardId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
  }
}
```

### 6. Käynnistä kehityspalvelin

```bash
npm run dev
```

Sovellus käynnistyy osoitteessa `http://localhost:5173`

### 7. Testaus (Playwright)

Sovelluksessa on Playwright-testit, jotka varmistavat responsiivisen ulkoasun:

```bash
# Asenna Playwright-selaimet (vain kerran)
npx playwright install chromium

# Aja visuaaliset testit
npm run test:visual

# Aja kaikki testit
npm test

# Avaa testit UI-tilassa
npm run test:ui
```

### 8. Tuotantoversio

```bash
npm run build
npm run preview
```

## Käyttöohjeet

### Ensimmäinen käyttöönotto

1. Rekisteröidy sähköpostilla tai Google-tilillä
2. Ensimmäinen käyttäjä saa automaattisesti "pelaaja"-roolin
3. Voit muuttaa käyttäjän roolin suoraan Firestore Consolessa:
   - Avaa `users`-kokoelma
   - Valitse käyttäjä
   - Muuta `role`-kenttä arvoon `"admin"`

### Admin-oikeudet

Kun sinulla on admin-oikeudet:
1. Kirjaudu sisään
2. Valitse **Hallinta**-välilehti
3. Hallitse käyttäjien rooleja (pelaaja, pitäjä, admin)

### Pelin luominen (Pitäjä)

1. Kirjaudu pitäjä- tai admin-tilillä
2. Valitse **Pitäjä**-välilehti
3. Klikkaa **Luo uusi peli**
4. Määrittele pelin asetukset:
   - Pelin nimi
   - Ruudukoiden määrä
   - Keskimmäinen ruutu annettu/ei
   - Voittotavat
5. Klikkaa **Luo peli**

### Pelin pelaaminen (Pitäjä)

1. Avaa luotu peli
2. Klikkaa **Aloita peli**
3. Arvo palloja klikkaamalla **🎱 Arvo pallo**
4. Näet arvotut pallot listana
5. Kun pelaaja ilmoittaa voiton:
   - Syötä ruudukon tunniste
   - Klikkaa **Tarkista**
   - Sovellus kertoo onko voitto

### Pelaaminen (Pelaaja)

1. Valitse **Pelaa**-välilehti
2. Näet käynnissä olevat pelit
3. Klikkaa **Liity peliin**
4. Valitse, kuinka monta ruudukkoa haluat (1-5)
5. Swipellä voit selata ruudukoita
6. Klikkaa numeroita merkataksesi ne
   - Voit merkitä vain jo arvottuja numeroita
7. Kun sinulla on BINGO:
   - Katso ruudukon tunniste (näkyy alhaalla)
   - Ilmoita tunniste pelin pitäjälle

## Projektin rakenne

```
bingo/
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── AdminPanel.jsx
│   │   │   └── Admin.css
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Auth.css
│   │   ├── Host/
│   │   │   ├── CreateGame.jsx
│   │   │   ├── GameControl.jsx
│   │   │   ├── HostDashboard.jsx
│   │   │   └── Host.css
│   │   ├── Player/
│   │   │   ├── BingoCard.jsx
│   │   │   ├── GameList.jsx
│   │   │   ├── PlayGame.jsx
│   │   │   ├── PlayerDashboard.jsx
│   │   │   └── Player.css
│   │   └── Layout/
│   │       ├── Header.jsx
│   │       ├── Navigation.jsx
│   │       └── Layout.css
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── firebase/
│   │   ├── config.js
│   │   └── auth.js
│   ├── utils/
│   │   └── bingoUtils.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
└── README.md
```

## BINGO-säännöt

### Ruudukon rakenne
- 5x5 ruudukko
- Sarakkeet: B-I-N-G-O
- Keskimmäinen ruutu voi olla "vapaa" (★)

### Numerojakauma
- **B**: 1-15
- **I**: 16-30
- **N**: 31-45
- **G**: 46-60
- **O**: 61-75

### Voittotavat
1. **Suora linja**: Viisi peräkkäistä merkkiä
   - Vaakasuoraan
   - Pystysuoraan
   - Diagonaalisti
2. **Kulmat**: Neljä kulmaa merkitty
3. **Koko ruudukko**: Kaikki 25 ruutua merkitty

## Kehitysideoita

- [ ] Real-time päivitykset (Firestore onSnapshot)
- [ ] Ääniefektit pallojen arvonnalle
- [ ] Animaatiot voitolle
- [ ] Chat-toiminto peleihin
- [ ] Pelien historia ja tilastot
- [ ] Monta voittajaa samassa pelissä
- [ ] Tulostettavat BINGO-kortit (PDF)
- [ ] Offline-tuki (PWA)

## Tuki ja kehitys

Jos kohtaat ongelmia:
1. Tarkista Firebase-konfiguraatio
2. Varmista että Authentication ja Firestore ovat käytössä
3. Tarkista selaimen konsolista virheviestit
4. Varmista että käyttäjällä on oikea rooli

## Lisenssi

MIT

## Tekijät

BINGO-peli - React + Firebase SPA
