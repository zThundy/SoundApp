
## 0.0.2

- Test release

## 0.0.3

- New test release

## 0.0.4

- Build workflow now finalized
- Automatic audit workflow

## 0.0.5

## 0.1.0

- Added button in home page to add a new reward
- Added security to README

## 0.1.1

- Added icon to build
- Started working on some local tests

## 0.1.2

- Working on automatic updater
- Added loading on preload for updater

## 0.1.3

- Fixed repository permission
- Added logger that logs stuff in Roaming\stream-alerts\logs
- Complete rewrite of the updater logic
- Added app version in settings
- Complete restyle of updater components
- Code cleanup
- Styling touchup

## 0.1.4

- Added some missing translations

## 0.1.5

- Added logic to create button
- Added logic to update reward
- Created local saving of rewards to recognize if app created
- Added delete button on custom redeem details
- Added modal to confirm delete of custom redeem
- Added notification provider
- Added notification for redeem creation
- Added notification for redeem modify
- Added notification for redeem delete
- Added refresh button to the redeem list
- WIP: Automatic refresh list logic
- WIP: Refresh button logic

## 0.1.6

- General styling fixes and changes
- Added description to error notification
- Added translations
- Added list refresh button logic
- Added general list refresh logic

## 0.1.7

- Language modification
- Added pirate language

## 0.1.8

- Tooltip style changed
- Added credits to the settings page

## 0.1.9

- Added twitch chat route
- Changed webserver logic
  + Alerts are now in /alerts
  + Chat is in /chat
  + /index shows a list of possible routes
- Added custom css/html/js to chat box
- Moved webserver html to static files
- Added some translations
- Changed tooltip styling (again)
- Minor improvements
- Styling changes

## 0.2.0

- Added missing translations
- Version bump up

## 0.2.1

- Changed window load
- Changed twitch module loading
- Changed editable alerts GET
- Removed local alerts save state

## 0.2.2

- Changed widow behaviour
- Added some missing translations
- Added new WIP page in the chat section

## 0.2.3

- Added chatbox templates
- Fixed some styling
- Added missing translations

## 0.2.4

- Complete refactor of fileManager logic
- Started working on File Uploader for custom files upload
  + You can upload files and use them in the chatbox component
  + You can upload any type of file
- Fixed issue in pages/*.html files so that JS functions will be triggered only on correct pages
- Added default html files for chat on first init
- Changed from "Chat" to "Twitch Events" tab for clear understanding
- Full restyle of sidebar
- Added Follow sub event type to Twitch
- Added Subscriber sub event type to Twitch
- Started working on different alert types and screen in the alert section
- Solution of multiple security issues with React
- Added open at startup option in the settings
- Added missing translation on events page

## 0.2.5

- Fixed huge issue where the servers wouldn't correctly read the pages files
- Fixed issue where registry would not be initialized

## 0.2.6

- Changed navigator in the Alerts Editor
- Changed style of left navigator menu
- Added Subscription Alert
- Added Subscription with message Alert
- Added Gifter Subscription Alert
- Added bits Alert
- Fixed some processor minor errors
- Added missing translations
- Added Twitch dev server capabilities
- Cleanup frontend html for alerts
- Added more scopes for subscriptions and bits to authentication flow

## 0.2.7

- Changed logic of image save and get in the alerts editor
- Changed style of buttons in alerts editor
- Divided test and save button in alerts editor
- Added audio functionality to all new alerts
  + Follow
  + Subscriber
  + Bits

## 0.2.8

- Refactor of twitch processor
- Added capability of translating emotes in messages to URL images
- Restructure of messages in twitch events for translating emotes to images
- Small fixes to alerts html static page

## 0.2.9

- Added some different templates to the chat component
- Changed import logic inside the chat template
- Added fake messages to chatbox
- Changed style of twitch events
- Added emotes to chatboxes
  + First crude implementation, to be reviewed
- Added emotes to twitch events list
  + First crude implementation, to be reviewed
- Added animated emotes type
- Restructure of caching in twitch event listner
- Moved types to separate files in electron/main
- Small changes to the chat.html and alerts.html

## 0.2.10

- Fixed issue on login - moved to external browser
  + The entire app would lose all references to static files in React Router
  + Sometimes the redirect would not work properly
- Changed auth flow and moved login to the settings page
- Added new chat templates
- Minor fixes to static files

*New branch*
- Started working on youtube integration for livestreams

## 0.2.11

- Added raid alert
- Added list of changes to update page
- Fixed GH workflow

## 0.2.12

- Fixed styling of release page
- Minor restyling to the alerts and chats templates
- Added automatic refresh to pages on template change
- Added Auto resize of twitch emotes
- Added global twitch emote fetching and caching

## 0.3.0

- Added emote wall

## 0.3.1

- Minor fixes to login
- Minor fixes to settings page

## 0.3.2

- Added "Check for updates" in settings
- Added "update-not-available" check on updater route

## 0.3.3
