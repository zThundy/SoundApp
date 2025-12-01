# SoundApp

[![Build and Release](https://github.com/zThundy/SoundApp/actions/workflows/build.yml/badge.svg)](https://github.com/zThundy/SoundApp/actions/workflows/build.yml)
[![Version - v0.0.6](https://img.shields.io/badge/Version-v0.0.6-2ea44f)](https://github.com/zThundy/SoundApp/releases)

An Electron application to manage alerts (and sounds) for Twitch streams.

![Application Screenshot](.github/screenshots/application.png)

## Alerts Page for OBS

When the application starts, a small local web server is automatically launched that serves a blank page designed to be captured by OBS.

Default local URL:

```
http://localhost:4823/
```

### How to use it in OBS
1. Open OBS.
2. Add a new source: Browser Source.
3. Enter the URL `http://localhost:4823/`.
4. The page is initially blank. Alerts will appear in the center when sent from the app.

### Security / Scope
The server listens only on `127.0.0.1` and is therefore accessible only locally.

### Issues / ideas
For issues or ideas: open an issue in the repository.

## Creating Alerts from the Frontend

From the menu (alerts page) you can create two types of alerts:

![OBS Integration](.github/screenshots/alert.png)
![Alert Creation](.github/screenshots/events-chat.png)

1. Custom HTML/CSS/JS
	- Work in progress

2. Image Template
	- Select an image file.
	- Set the text (caption) displayed below.
	- Duration (ms) indicates how long it remains visible (default 6000).
	- Press "Send Image Template" to send.