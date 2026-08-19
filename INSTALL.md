# How to install Study Room Pixel

Simple guide to install the app on a Mac or a Windows PC, no code required.

This app doesn't phone home anywhere on the internet — no website, no store,
no data sent or received over the network (details in
[SECURITY.md](./SECURITY.md)).

## Look at what you're about to run (optional, but healthy)

You don't have to trust this page: the app is open source, and everything the
installer contains is built from the files in this repository. If you (or a
technical friend) want to check before installing, the interesting parts are
small: `src/main/index.ts` (the app itself), `src/shared/config.ts` (the only
file it saves), and [SECURITY.md](./SECURITY.md) (what it can and cannot do).

## On a Mac

### 1. Get the installer

Go to [Releases](https://github.com/malenitaa/study-room-pixel/releases) and
download the `Study Room Pixel-x.x.x-universal.dmg` file.

### 2. Install

1. Double-click the `.dmg` file to open it.
2. A window will open: drag the **Study Room Pixel** icon into the
   **Applications** folder.
3. Close that window and you can eject the `.dmg` (eject button next to the name in Finder).

### 3. Opening it for the first time

Since this app isn't signed by a registered Apple developer (it's not an App
Store app or from a company with a paid certificate), the first time you open
it **macOS will warn you it can't verify who made it**. This is normal for
small/personal apps and doesn't mean it's broken. To open it:

1. Go to the **Applications** folder and find **Study Room Pixel**.
2. **Right-click** (or Ctrl+click) the icon → choose **Open**.
3. A warning dialog will show up — click **Open** again in that dialog (this right-click
   confirmation only needs to happen the first time).

If that's not enough (macOS can still block it sometimes), another option:

1. Go to **System Settings** → **Privacy & Security**.
2. Scroll down to the Security section, where you'll see a message like *"Study Room Pixel
   was blocked to protect your Mac."*
3. Click **Open Anyway**.

## On Windows

### 1. Get the installer

Go to [Releases](https://github.com/malenitaa/study-room-pixel/releases) and
download `Study Room Pixel Setup x.x.x.exe`.

### 2. Install

Run the downloaded file and follow the installer (you can pick the install
folder if you want).

Because the installer isn't signed with a paid certificate, **SmartScreen may
show "Windows protected your PC"**. That warning is about the missing
signature, not about anything found in the app. To continue:

1. Click **More info**.
2. Click **Run anyway**.

⚠️ In both systems the fix is always one extra click — **never disable
Gatekeeper, SmartScreen, or your antivirus** to install anything, this app
included. If an installation guide asks you to turn protections off, be
suspicious.

## Using it

- Pick a scene (rain, fireplace, café, library) top left — it switches instantly, no reload.
- Adjust the ambient volume and the notification volume separately, bottom right.
- Set up the timer with the preset minute buttons or by typing your own minutes, then click
  **Start**.
- The pin (📌) top right keeps the window always visible above others — useful for running it
  as a background while working on something else.
- The fullscreen icon (⛶) makes it fullscreen.
- The **AUTO / EN / ES** button top right switches the language (AUTO follows
  your system language).
- You can resize the window by dragging the edge, like any normal window.

## Uninstall

- **Mac:** drag **Study Room Pixel** from **Applications** to the Trash. Its
  preferences (scene, volumes, timer duration, language) are saved in a small
  file; to delete those too, remove the `Study Room Pixel` folder inside
  `~/Library/Application Support/`.
- **Windows:** uninstall it from **Settings → Apps**, like any other program.
  To also delete the preferences, remove the `Study Room Pixel` folder inside
  `%APPDATA%`.
