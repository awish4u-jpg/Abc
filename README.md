# Table Tennis Tracker

Two-player score sheet, synced live via Supabase. Clone the repo, paste your Supabase project URL and publishable (anon) key into `config.js`, run the SQL block from the project brief in the Supabase SQL editor and enable Realtime on `matches` and `players`, then either open `index.html` directly in a browser or push to a repo with GitHub Pages enabled (branch `main`, folder `/`). To reset all match history, run `truncate matches restart identity;` in the Supabase SQL editor; to reset player names, run `update players set p1 = 'Awish', p2 = 'Dhruv' where id = 1;`.
