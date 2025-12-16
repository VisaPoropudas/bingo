# Visan BINGO - Moderni digitaalinen bingopeli

Visan BINGO on täysiverinen digitaalinen bingopeli, joka on rakennettu React-teknologialla ja Firebase-tietokannalla. Sovellus mahdollistaa saumattoman pelikokemuksen sekä pelinpitäjälle että pelaajille mobiililaitteilla ja tietokoneilla.

## 📱 Ominaisuudet

### 🎮 Pelaajatoiminnot
- **Liity peleihin helposti**: Näe kaikki käynnissä olevat pelit yhdellä vilkaisulla
- **1-5 BINGO-ruudukkoa**: Valitse kuinka monta ruudukkoa haluat pelata kerralla
- **Swipe-navigointi**: Selaa ruudukoitasi näppärästi pyyhkäisemällä vasemmalle tai oikealle
- **Automaattinen tai manuaalinen merkkaus**:
  - **Automaattitila**: Sovellus merkitsee arvotut numerot automaattisesti
  - **Manuaalitila**: Seuraa numeroita itse ja merkitse ne napauttamalla
- **QR-koodi tarkistukseen**: Jokainen ruudukko sisältää QR-koodin nopeaa voiton tarkistusta varten
- **Lyhyet ruudukkotunnisteet**: Maksimissaan 5 merkkiä pitkät tunnisteet helpottavat ilmoittamista
- **Responsiivinen Bootstrap UI**: Toimii moitteettomasti kaikilla laitteilla

### 🎯 Pelinpitäjän työkalut
- **Pelin luonti ja hallinta**: Luo pelejä muutamalla klikkauksella
- **Monipuoliset voittoehdot**:
  - **Vaakarivit**: Täydet vaakasuorat rivit
  - **Pystyrivit**: Täydet pystysuorat rivit
  - **Diagonaalit**: Täydet lävistäjät
  - **Kulmat**: Neljän kulman numerot
  - **Koko ruudukko**: Kaikki 25 numeroa
- **Progressiiviset voittoehdot**: Aseta vaadittujen rivien määrä (1-5 riviä)
- **Pallojen arvonta**: Arvo palloja napista (75 palloa yhteensä)
- **Arvonta historia**: Näe kaikki arvotut pallot järjestyksessä ja viimeisin pallo korostettuna
- **Voiton tarkistus**:
  - **QR-skannaaja**: Skannaa pelaajan ruudukon QR-koodi kameralla
  - **Manuaalinen syöttö**: Kirjoita ruudukkotunniste käsin
  - **Hakutoiminto**: Tukee sekä lyhyitä (5 merkkiä) että vanhoja pitkiä tunnisteita
- **Tulostettavat ruudukot**: Luo PDF-tiedosto paperiversioita varten
  - **A4 vaakasuunta**: Optimoitu tulostusta varten
  - **1-3 ruudukkoa per sivu**: Valitse tiheys paperikoon mukaan
  - **QR-koodit mukana**: Helppo tarkistus myös paperiruudukoilla

### ⚙️ Admin-hallinta
- **Käyttäjäroolien hallinta**: Ylennä käyttäjiä pelaajista pitäjiksi tai adminiksi
- **Täydet järjestelmäoikeudet**: Pääsy kaikkiin peleihin ja asetuksiin
- **Itsepalvelu admin-asetus**: Ensimmäinen käyttäjä voi tehdä itsestään adminin

## 🛠️ Teknologiat

### Frontend
- **React 19**: Uusin versio tehokkaampaan komponenttien renderöintiin
- **React Router v7**: Reititys ja navigointi
- **React Bootstrap 5**: Responsiivinen UI-komponenttikirjasto
- **Vite**: Nopea kehityspalvelin ja tuotantokoostaja
- **React Swipeable**: Kosketusnäyttöjen swipe-toiminnallisuus

### Backend & Palvelut
- **Firebase Authentication**: Google- ja sähköpostikirjautuminen
- **Cloud Firestore**: Reaaliaikainen NoSQL-tietokanta
- **Firebase Hosting**: (Valinnainen) Tuotantojulkaisu

### Lisäkomponentit
- **jsPDF**: PDF-generointi tulostettaville ruudukoille
- **QRCode**: QR-koodien luominen
- **@yudiel/react-qr-scanner**: QR-koodien skannaus kameralla
- **Playwright**: Automaattiset selaintestit ja UI-testaus

## 📦 Asennus ja käyttöönotto

### 1. Kloonaa projekti

```bash
git clone <repository-url>
cd bingo
npm install
```

### 2. Luo Firebase-projekti

1. Mene osoitteeseen [Firebase Console](https://console.firebase.google.com/)
2. Luo uusi projekti tai valitse olemassa oleva
3. Ota käyttöön **Authentication**:
   - Kirjautumismenetelmät → **Email/Password** → Ota käyttöön
   - Kirjautumismenetelmät → **Google** → Ota käyttöön
4. Luo **Cloud Firestore** -tietokanta:
   - Aloita **test mode** -tilassa (kehitys)
   - Tuotannossa käytä suositeltuja security ruleja (katso alempaa)

### 3. Konfiguroi Firebase

Luo projektin juureen `.env` tiedosto ja lisää Firebase-projektin tiedot:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

💡 **Tiedot löytyvät**: Firebase Console → Project Settings → Your apps → Web app (</> ikoni)

⚠️ **HUOM**: `.env` tiedosto on `.gitignore`:ssa, joten API-avaimet eivät päädy versionhallintaan.

### 4. Firestore-tietokannan rakenne

Sovellus luo automaattisesti seuraavat kokoelmat:

#### **users** (käyttäjät)
```javascript
users/{userId}
  - email: string              // Käyttäjän sähköposti
  - displayName: string        // Näyttönimi
  - role: string               // "admin" | "pitäjä" | "pelaaja"
  - createdAt: timestamp       // Luontiaika
```

#### **games** (pelit)
```javascript
games/{gameId}
  - name: string                        // Pelin nimi
  - hostId: string                      // Pitäjän user ID
  - hostName: string                    // Pitäjän nimi
  - centerFree: boolean                 // Onko keskiruutu vapaa
  - autoMark: boolean                   // Automaattinen merkkaus
  - winConditions: {                    // Voittoehdot
      horizontal: boolean,              // Vaakarivit
      vertical: boolean,                // Pystyrivit
      diagonal: boolean,                // Diagonaalit
      corners: boolean,                 // Kulmat
      fullCard: boolean                 // Koko ruudukko
    }
  - requiredLines: number               // Vaadittujen rivien määrä (1-5)
  - status: string                      // "waiting" | "active" | "finished"
  - calledBalls: array                  // Arvotut pallot ["B-7", "I-23", ...]
  - createdAt: timestamp                // Luontiaika
  - maxCards: number                    // Ruudukoiden maksimimäärä

  cards/{cardId}                        // Alakokoelma: Peliruudukot
    - id: string                        // Lyhyt tunniste (5 merkkiä)
    - cells: array                      // 25 ruutua: [{row, col, column, number, isFreeSpace}, ...]
    - assigned: boolean                 // Onko jaettu pelaajalle
    - assignedTo: string | null         // Kenelle jaettu (user ID)
```

### 5. Firestore Security Rules (Tuotanto)

Korvaa Firestore Rules seuraavalla (Firebase Console → Firestore Database → Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Käyttäjät - luettavissa kirjautuneille, muokattavissa vain itselle tai adminille
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Pelit
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                       (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'pitäjä' ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow update: if request.auth != null &&
                       (resource.data.hostId == request.auth.uid ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Peliruudukot - kirjautuneet voivat lukea ja kirjoittaa
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

Sovellus käynnistyy osoitteessa: **http://localhost:5173**

### 7. Testaus (Playwright)

Sovelluksessa on Playwright-testit responsiivisuuden ja toiminnallisuuden varmistamiseksi:

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
# Rakenna tuotantoversio
npm run build

# Esikatsele tuotantoversiota
npm run preview
```

Valmis `dist/` kansio voidaan julkaista Firebase Hostingiin, Netlifyyn, Verceliin tai mihin tahansa staattisen sisällön palvelimelle.

## 📖 Käyttöohjeet

### Ensimmäinen käyttöönotto

1. **Rekisteröidy**:
   - Avaa sovellus selaimessa
   - Klikkaa **Rekisteröidy**
   - Valitse **Google-kirjautuminen** tai **sähköposti + salasana**

2. **Aseta ensimmäinen admin**:
   - Ensimmäinen käyttäjä saa automaattisesti "pelaaja"-roolin
   - Kirjaudu sisään
   - Siirry **Hallinta**-välilehdelle
   - Klikkaa **Tee minusta admin** -painiketta
   - Nyt sinulla on täydet oikeudet

### Admin-toiminnot

**Käyttäjäroolien hallinta:**
1. Kirjaudu admin-tilillä
2. Avaa **Hallinta**-välilehti
3. Näet listan kaikista käyttäjistä
4. Vaihda käyttäjän roolia pudotusvalikosta:
   - **Pelaaja**: Pääsee vain pelaamaan
   - **Pitäjä**: Voi luoda ja pitää pelejä
   - **Admin**: Täydet oikeudet

### Pelin luominen (Pitäjä)

1. Kirjaudu **pitäjä**- tai **admin**-tilillä
2. Siirry **Pitäjä**-välilehdelle
3. Klikkaa **➕ Luo uusi peli**
4. Täytä pelin asetukset:
   - **Pelin nimi**: Esim. "Lauantain bingo"
   - **Ruudukoiden määrä**: Kuinka monta korttia luodaan (esim. 50)
   - **Keskimmäinen ruutu annettu**: ✅ = Keskellä on vapaa tähti (★)
   - **Automaattinen merkkaus**: ✅ = Numerot merkitään automaattisesti
   - **Voittoehdot**: Valitse yksi tai useampi:
     - Vaakarivit
     - Pystyrivit
     - Diagonaalit
     - Kulmat
     - Koko ruudukko
   - **Vaadittujen rivien määrä**: 1-5 riviä (progressiivinen peli)
5. Klikkaa **Luo peli**

### Pelin pelaaminen (Pitäjä)

1. **Avaa luotu peli**:
   - Klikkaa pelin nimeä listasta

2. **Aloita peli**:
   - Klikkaa **▶ Aloita peli**

3. **Arvo palloja**:
   - Klikkaa **🎱 Arvo pallo**
   - Viimeisin arvottu pallo näkyy isosti
   - Kaikki arvotut pallot näkyvät listassa

4. **Tarkista voitto**:
   - **QR-skannauksella**:
     - Klikkaa **📷 Skannaa QR**
     - Anna kameraluvat
     - Osoita kamera pelaajan ruudukon QR-koodiin
     - Sovellus tarkistaa voiton automaattisesti
   - **Manuaalisesti**:
     - Pyydä pelaajalta ruudukkotunniste
     - Kirjoita tunniste kenttään
     - Klikkaa **✓ Tarkista**
     - Sovellus näyttää voittotiedot

5. **Tulosta paperiversiot** (Valinnainen):
   - Klikkaa **📄 Tulosta kortit**
   - Valitse **1-3 korttia per sivu**
   - Klikkaa **Lataa PDF**
   - Tulosta PDF ja jaa pelaajille

### Pelaaminen (Pelaaja)

1. **Liity peliin**:
   - Siirry **Pelaa**-välilehdelle
   - Näet käynnissä olevat pelit
   - Klikkaa **Liity peliin**

2. **Valitse ruudukoiden määrä**:
   - Valitse **1-5 ruudukkoa**
   - Klikkaa **Liity**

3. **Pelaa**:
   - **Automaattitila** (oletus): Numerot merkitään automaattisesti kun pitäjä arpoo ne
   - **Manuaalitila**: Klikkaa numeroita merkitäksesi ne itse
   - **Selaa ruudukoita**: Pyyhkäise vasemmalle/oikealle tai käytä nuolipainikkeita
   - **Seuraa viimeksi arvottua palloa**: Näkyy ruudukon yläpuolella

4. **Ilmoita BINGO**:
   - Kun sinulla on voittoehdon mukainen rivi/rivit
   - **QR-koodilla**: Näytä ruudukon QR-koodi pitäjälle skannattavaksi
   - **Tunnisteella**: Ilmoita ruudukkotunniste pitäjälle (näkyy ruudukon alla)

## 🎲 BINGO-säännöt

### Ruudukon rakenne
- **5×5 ruudukko** (25 ruutua)
- Sarakkeet: **B - I - N - G - O**
- Keskellä voi olla vapaa tähti **★** (riippuu pelin asetuksista)

### Numerojakauma (Amerikkalainen BINGO)
| Sarake | Numeroalue |
|--------|------------|
| **B**  | 1–15       |
| **I**  | 16–30      |
| **N**  | 31–45      |
| **G**  | 46–60      |
| **O**  | 61–75      |

### Voittotavat

1. **Vaakarivit**: Täysi vaakasuora rivi (5 numeroa)
2. **Pystyrivit**: Täysi pystysuora rivi (5 numeroa)
3. **Diagonaalit**: Täysi lävistäjä (5 numeroa)
4. **Kulmat**: Neljä kulmaa merkitty
5. **Koko ruudukko**: Kaikki 25 numeroa merkitty

**Progressiivinen peli**: Pitäjä voi asettaa vaadittujen rivien määrän (1-5). Esimerkiksi:
- **1. kierros**: 1 rivi
- **2. kierros**: 2 riviä
- **3. kierros**: 3 riviä
- jne.

## 📁 Projektin rakenne

```
bingo/
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── AdminPanel.jsx        # Käyttäjäroolien hallinta
│   │   │   ├── SetupAdmin.jsx        # Ensimmäinen admin-asetus
│   │   │   └── Admin.css
│   │   ├── Auth/
│   │   │   ├── Login.jsx             # Kirjautuminen
│   │   │   ├── Register.jsx          # Rekisteröityminen
│   │   │   └── Auth.css
│   │   ├── Host/
│   │   │   ├── CreateGame.jsx        # Pelin luonti
│   │   │   ├── GameControl.jsx       # Pelin hallinta ja arvonta
│   │   │   ├── GameList.jsx          # Pitäjän pelilista
│   │   │   ├── HostDashboard.jsx     # Pitäjän pääsivu
│   │   │   └── Host.css
│   │   ├── Player/
│   │   │   ├── BingoCard.jsx         # BINGO-ruudukko komponentti
│   │   │   ├── GameList.jsx          # Pelaajan pelilista
│   │   │   ├── PlayGame.jsx          # Pelaaminen
│   │   │   ├── PlayerDashboard.jsx   # Pelaajan pääsivu
│   │   │   └── Player.css
│   │   └── Layout/
│   │       ├── Header.jsx            # Yläpalkki
│   │       ├── Navigation.jsx        # Navigaatio (Pelaaja/Pitäjä/Admin)
│   │       └── Layout.css
│   ├── contexts/
│   │   └── AuthContext.jsx           # Kirjautumisen context
│   ├── firebase/
│   │   ├── config.js                 # Firebase-konfiguraatio
│   │   └── auth.js                   # Autentikointifunktiot
│   ├── utils/
│   │   ├── bingoUtils.js             # BINGO-logiikka (generointi, voiton tarkistus)
│   │   └── pdfGenerator.js           # PDF-generointi
│   ├── App.jsx                       # Pääkomponentti
│   ├── App.css
│   ├── index.css
│   └── main.jsx                      # Sovelluksen entry point
├── .env                              # Firebase-konfiguraatio (EI versionhallintaan!)
├── .gitignore
├── package.json
├── vite.config.js
├── playwright.config.js
└── README.md
```

## 🚀 Kehitysideoita ja tulevaisuuden ominaisuudet

- [x] ~~Real-time päivitykset~~ (Toteutettu Firestore onSnapshotilla)
- [x] ~~QR-koodien tuki~~ (Toteutettu)
- [x] ~~PDF-tulostus~~ (Toteutettu)
- [x] ~~Progressiiviset voittoehdot~~ (Toteutettu)
- [ ] Ääniefektit pallojen arvonnalle
- [ ] Animaatiot voitolle (confetti, räiskeet)
- [ ] Chat-toiminto peleihin (pelaajat voivat keskustella)
- [ ] Pelien historia ja tilastot (voittoprosentit, suosituimmat numerot)
- [ ] Monta voittajaa samassa pelissä (jaetut voitot)
- [ ] Offline-tuki (Progressive Web App)
- [ ] Push-ilmoitukset pelin alkaessa
- [ ] Pelin uusintatoiminto (pelaa sama setti uudelleen)
- [ ] Teema- ja värivalinnat

## 🐛 Tuki ja vianmääritys

### Yleiset ongelmat

**"Firebase-virhe: Permission denied"**
- Tarkista että Firestore Security Rules on asetettu oikein
- Varmista että käyttäjä on kirjautunut sisään

**"Ei voita vaikka rivit täynnä"**
- Tarkista pelin voittoehdot (vain valitut voittotavat ovat käytössä)
- Progressiivisissa peleissä tarkista vaadittujen rivien määrä

**"QR-skannaus ei toimi"**
- Anna kameraluvat selaimessa
- Tarkista valaistus (QR-koodin tulee olla selkeästi näkyvissä)
- Kokeile manuaalista tunnisteensyöttöä

**"PDF-generointi ei toimi"**
- Tarkista että selain tukee jsPDF:ää (uusimmat Chrome, Firefox, Safari, Edge)
- Kokeila ladata vähemmän ruudukoita kerralla

### Tarvitsetko apua?

1. Tarkista **selaimen konsoli** (F12) virheviestien varalta
2. Varmista että **Firebase-konfiguraatio** on oikein (.env-tiedosto)
3. Tarkista että **Authentication** ja **Firestore** ovat käytössä Firebase Consolessa
4. Varmista että käyttäjän **rooli** on oikea (`users/{userId}/role`)

## 📄 Lisenssi

MIT License - Vapaa käyttöön, muokkaukseen ja levittämiseen.

## 👥 Tekijät

**Visan BINGO** - React + Firebase BINGO-sovellus
Kehitetty modernilla JavaScript-teknologialla (React 19, Vite, Firebase).

---

**Kiitos että käytät Visan BINGOa!** 🎉
Nauti pelistä ja onnea ruudukoille! 🍀
