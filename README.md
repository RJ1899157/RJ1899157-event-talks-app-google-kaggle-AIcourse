# BigQuery Release Notes Hub & Tweet Composer 🚀

An elegant, dark-themed, glassmorphic web dashboard built with Python Flask and vanilla HTML/CSS/JS. It parses Google Cloud's BigQuery Release Notes RSS/Atom feed, structures them into individual updates, allows filtering/searching, and includes a built-in Tweet composer to post updates directly to X (Twitter).

## Features

-   **Live Sync & Caching:** Fetch the latest updates directly from the official XML feed with a simple refresh button, including a spinning loader and in-memory caching to optimize performance.
-   **Dashboard Analytics:** Clean counters showing total updates, features, announcements, and issues/fixes with smooth numerical count-up animations.
-   **Granular Parsing:** Parses daily release note entries and splits them by category headers (`Feature`, `Announcement`, `Changed`, `Deprecation`, etc.) to show individual updates as cards rather than daily dumps.
-   **Live Keyword Search:** Instant search updates as you type (matches date, content text, or categories).
-   **Type Filters:** Pill tags to filter updates instantly in the client (Feature, Announcement, Changed, Deprecation, Issue).
-   **Dynamic X (Twitter) Composer:**
    -   Click **Tweet This Update** on any card to open a custom composer modal.
    -   Automatically truncates long updates and prepends category tags and dates while leaving space for links and hashtags.
    -   Includes a character counter with safety limits (turning red if exceeding X's 280-char limit).
    -   Supports direct "Post to X" redirection via Twitter Web Intent.
    -   Provides a "Copy Text" action with instant clipboard feedback.
-   **Rich Aesthetics:** Modern dark interface leveraging glowing background radial orbs, custom-styled scrollbars, glassmorphism panels, CSS shimmer skeletons, and smooth CSS animations.

---

## Technical Stack

-   **Backend:** Python 3 (Flask, `requests`, `beautifulsoup4`)
-   **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6)
-   **Design:** Custom styles using HSL-tailored colors, Google Fonts (`Plus Jakarta Sans` for body, `Space Grotesk` for numbers, and `JetBrains Mono` for code blocks), and inline SVGs.
-   **Feed URL:** [https://docs.cloud.google.com/feeds/bigquery-release-notes.xml](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)

---

## File Structure

-   [app.py](file:///Users/rishabhjain/agy-cli-projects/bq-releases-notes/app.py): The Flask backend server. Handles XML parsing, caching, and serving API responses.
-   [templates/index.html](file:///Users/rishabhjain/agy-cli-projects/bq-releases-notes/templates/index.html): The HTML base structure of the app and modal.
-   [static/css/style.css](file:///Users/rishabhjain/agy-cli-projects/bq-releases-notes/static/css/style.css): Main stylesheet with themes, layout, shimmer loaders, and keyframes.
-   [static/js/main.js](file:///Users/rishabhjain/agy-cli-projects/bq-releases-notes/static/js/main.js): Frontend app logic (fetching, filtering, searching, modal, clipboard, and tweeting).
-   [requirements.txt](file:///Users/rishabhjain/agy-cli-projects/bq-releases-notes/requirements.txt): List of dependencies (`Flask`, `requests`, `beautifulsoup4`).

---

## Installation & Setup

1.  **Clone or Navigate to the directory:**
    ```bash
    cd /Users/rishabhjain/agy-cli-projects/bq-releases-notes
    ```

2.  **Activate Virtual Environment & Install Dependencies:**
    A virtual environment `.venv` has already been configured and set up. Run the following command to activate it and ensure all dependencies are installed:
    ```bash
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Run the Flask Server:**
    ```bash
    python app.py
    ```
    The server will start locally on `http://127.0.0.1:5001`.

4.  **View in Browser:**
    Open [http://127.0.0.1:5001](http://127.0.0.1:5001) in your browser.
