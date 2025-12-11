# File Upload Manager con UUID References

Un sistema completo per gestire l'upload di file nell'app Electron con riferimenti UUID che possono essere usati come variabili in tutta l'applicazione.

## Caratteristiche

- ✅ Upload di file con UUID univoci
- ✅ Mapping persistente dei file (registry.json)
- ✅ Categorizzazione dei file (audio, images, etc.)
- ✅ Recupero file tramite UUID
- ✅ Eliminazione file
- ✅ Metadata file
- ✅ Sostituzione UUID in stringhe
- ✅ API Frontend con hook React

## Architettura

### Backend (Electron Main Process)

#### `uploadManager.ts`
Gestisce la memorizzazione e il recupero dei file:
- Upload con UUID
- Persistenza registry
- Categorizzazione file
- Operazioni file (read, delete)

#### `ipc/uploadHandlers.ts`
Espone gli IPC handlers:
- `upload:file` - Caricare file
- `upload:getFile` - Recuperare file
- `upload:getMetadata` - Metadata file
- `upload:deleteFile` - Eliminare file
- `upload:getByCategory` - File per categoria
- `upload:getAll` - Tutti i file
- `upload:getPath` - Percorso file (per serving)

### Frontend (React)

#### `hooks/useUploadManager.ts`
Hook React per gestire gli upload:
```typescript
const { uploadFile, getFile, getMetadata, deleteFile, loading, error } = useUploadManager()
```

#### `utils/uuidReplacer.ts`
Utility per sostituire UUID nelle stringhe:
```typescript
replaceUUIDs(text, uuidMap) // Sostituire tutti gli UUID
extractUUIDs(text)           // Estrarre UUID da testo
hasUUIDs(text)               // Verificare se ha UUID
replaceUUID(text, uuid, replacement) // Sostituire singolo UUID
```

## Utilizzo

### 1. Upload di un file

```typescript
const { uploadFile, loading } = useUploadManager()

// Upload file
const file = inputElement.files[0]
const uuid = await uploadFile(file, 'audio')
// Restituisce: "123e4567-e89b-12d3-a456-426614174000"
```

### 2. Usare UUID come variabile nel testo

```typescript
const textWithReference = `Play sound {123e4567-e89b-12d3-a456-426614174000}`
```

### 3. Recuperare il file dal UUID

```typescript
const { getMetadata } = useUploadManager()

const metadata = await getMetadata('123e4567-e89b-12d3-a456-426614174000')
// metadata.storagePath = "audio/123e4567-e89b-12d3-a456-426614174000.mp3"
```

### 4. Sostituire UUID con percorsi effettivi

```typescript
import { replaceUUIDs, extractUUIDs } from '../utils/uuidReplacer'

const text = "Play sound {uuid1}, then {uuid2}"
const uuids = extractUUIDs(text) // ["uuid1", "uuid2"]

const uuidMap = {
  uuid1: "/uploads/audio/uuid1.mp3",
  uuid2: "/uploads/audio/uuid2.mp3"
}

const replaced = replaceUUIDs(text, uuidMap)
// Result: "Play sound /uploads/audio/uuid1.mp3, then /uploads/audio/uuid2.mp3"
```

### 5. Categorizzare i file

```typescript
// Upload nella categoria "audio"
const audioUuid = await uploadFile(audioFile, 'audio')

// Upload nella categoria "images"
const imageUuid = await uploadFile(imageFile, 'images')

// Recuperare tutti i file audio
const audioFiles = await getByCategory('audio')
```

### 6. Ottenere il file sul frontend

```typescript
const { getFile, getPath } = useUploadManager()

// Opzione 1: Ottenere il buffer
const buffer = await getFile(uuid)

// Opzione 2: Ottenere il percorso per serving
const filePath = await getPath(uuid)
```

## Struttura dei dati

### FileMapping (Registry)
```typescript
{
  uuid: string              // UUID univoco
  originalName: string      // Nome originale del file
  storagePath: string       // Percorso relativo nello storage
  uploadedAt: number        // Timestamp upload
  category: string          // Categoria (es. "audio", "images")
}
```

### Registry File
Memorizzato in: `userData/uploads/registry.json`
```json
{
  "123e4567-e89b-12d3-a456-426614174000": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "originalName": "sound.mp3",
    "storagePath": "audio/123e4567-e89b-12d3-a456-426614174000.mp3",
    "uploadedAt": 1702292400000,
    "category": "audio"
  }
}
```

## Directory Structure

```
userData/
  uploads/
    registry.json           # Mapping UUID -> File
    audio/                  # Categoria audio
      uuid1.mp3
      uuid2.mp3
    images/                 # Categoria images
      uuid1.png
      uuid2.jpg
```

## Integrazione Web Server

Per servire i file tramite HTTP nel web server:

```typescript
// In webServer.ts
import uploadManager from './uploadManager'

// Aggiungere route statica
app.use('/uploads', express.static(uploadManager.getUploadDir()))

// Oppure route dinamica con verifiche
app.get('/uploads/:uuid', (req, res) => {
  const filePath = uploadManager.getFilePath(req.params.uuid)
  if (filePath) {
    res.sendFile(filePath)
  } else {
    res.status(404).send('File not found')
  }
})
```

## API Completa

### uploadManager (IPC)

#### `uploadFile(fileBuffer, fileName, category?)`
Upload di un file
- **Parametri:**
  - `fileBuffer`: Buffer del file
  - `fileName`: Nome originale
  - `category`: Categoria (default: 'default')
- **Ritorna:** `{ ok: boolean, uuid?: string, error?: string }`

#### `getFile(uuid)`
Recuperare il buffer di un file
- **Parametri:** `uuid`: UUID del file
- **Ritorna:** `{ ok: boolean, data?: Buffer, error?: string }`

#### `getMetadata(uuid)`
Recuperare i metadati di un file
- **Parametri:** `uuid`: UUID del file
- **Ritorna:** `{ ok: boolean, metadata?: FileMetadata, error?: string }`

#### `deleteFile(uuid)`
Eliminare un file
- **Parametri:** `uuid`: UUID del file
- **Ritorna:** `{ ok: boolean, message?: string, error?: string }`

#### `getByCategory(category)`
Recuperare tutti i file in una categoria
- **Parametri:** `category`: Nome categoria
- **Ritorna:** `{ ok: boolean, files?: FileMetadata[], error?: string }`

#### `getAll()`
Recuperare tutti i file registrati
- **Ritorna:** `{ ok: boolean, files?: FileMetadata[], error?: string }`

#### `getPath(uuid)`
Ottenere il percorso del file (per serving)
- **Parametri:** `uuid`: UUID del file
- **Ritorna:** `{ ok: boolean, path?: string, error?: string }`

## Hook useUploadManager

```typescript
const {
  uploadFile,      // Caricare file
  getFile,         // Recuperare file
  getMetadata,     // Metadati file
  deleteFile,      // Eliminare file
  getByCategory,   // File per categoria
  getAll,          // Tutti i file
  getPath,         // Percorso file
  loading,         // Stato loading
  error,           // Messaggio errore
} = useUploadManager()
```

## Esempio Completo

```typescript
import { useUploadManager } from '../hooks/useUploadManager'
import { replaceUUIDs, extractUUIDs } from '../utils/uuidReplacer'

export function MyComponent() {
  const { uploadFile, getMetadata } = useUploadManager()

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Upload file
    const uuid = await uploadFile(file, 'audio')
    
    // 2. Salvare UUID come riferimento
    const alertText = `Play {${uuid}} when triggered`
    
    // 3. Quando serve il percorso effettivo
    const metadata = await getMetadata(uuid)
    const actualPath = `/uploads/${metadata.storagePath}`
    
    // 4. Sostituire il reference nel testo
    const finalText = alertText.replace(`{${uuid}}`, actualPath)
  }

  return (
    <input type="file" accept="audio/*" onChange={handleAudioUpload} />
  )
}
```

## Persistenza

Il sistema memorizza automaticamente un `registry.json` che contiene il mapping tra UUID e file. Questo permette di:
- Recuperare il percorso di un file anche dopo il riavvio dell'app
- Ripercorrere la storia degli upload
- Pulire i file orfani

I file sono memorizzati in:
```
~/AppData/Roaming/SoundApp/uploads/  (Windows)
~/Library/Application Support/SoundApp/uploads/  (macOS)
~/.config/SoundApp/uploads/  (Linux)
```

## Note di Sicurezza

⚠️ Considerazioni di sicurezza:
- I file sono memorizzati in userData (protetto dall'OS)
- Gli UUID sono casualmente generati (v4)
- Validare sempre i file caricati sul backend
- Implementare limite di dimensione file
- Implementare pulizia periodica di file orfani

## Prossimi Miglioramenti

- [ ] Limite dimensione file
- [ ] Validazione tipo file
- [ ] Compressione file
- [ ] Backup automatico
- [ ] Quota storage per categoria
- [ ] Cleanup file orfani

