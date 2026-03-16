interface ReleaseNoteInfo {
  version?: string
  note?: string
}

interface VersionInfo {
  update: boolean
  version: string
  newVersion?: string
  releaseNotes?: string | ReleaseNoteInfo[]
}

interface ErrorType {
  message: string
  error: Error
}
