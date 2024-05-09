## TODO:
- Set Stats
  - Convert Std Set Stats query to use Imported Scryfall
- Card View
  - Make links absolutely positioned at the bottom with icons
  - Add mana cost of 'side'
- Deck Analysis
  - Add Color Identity Check Button to Draft/W2/W1 decks
- Preprocessor
  - Cleanup old CSVs and cached json automatically
- Git Repo
  - Backup Spreadsheet Content in repo
  - Backup Decklists in repo
- Miscellaneous
  - Integrate card symbols via the API: https://scryfall.com/docs/api/card-symbols/all
  - Find a way to automate dual-commander strategy summaries
  - Find a way to integrate scryfall 'tagger' data?


## 2024-05-08
- Card View
  - Added Roboto Font
  - Flip is now a separate button
  - Flip now changes type/ability text
  - Refresh button is cleaner/more convenient
  - Some rearranging to keep visual position consistency
  - Fixed bug where selected card of 'name' was treated as a card


## 2024-05-07
- Decks: Added Color Identity Check (need Button added in Draft/W2/W1 decks)
- Created OTJ Boxing League GitHub repo
- Preprocessor: Now uses Scryfall bulk_data API endpoint from the docs (https://scryfall.com/docs/api/bulk-data), with caching of actual downloaded file
- Preprocessor: Preserves double-faced card data
- Card View: Click to flip image 
- Git Repo: Added Apps Script
- Apps Script: Initial lint/cleanup pass

## 2024-05-06
- Sidebar: Added external links
- Sidebar: Added reload button
- Pool and Deck Sheets: Force CMC to be numbers with VALUE() to make math work
- Decks: Added Commander Field w/ Color Identity Calculation
- Pool/Decks: Replaced Score column with Color Identity to enable Color Checks, etc.
- Commanders Removed from Draw Pool

## 2024-04-29
- Added a card view sidebar
- Card view sidebar loads images
- Card view sidebar only redraws if card has changed
- Card view sidebar only does one server request at a time
- Card view selected card lookup starts on selection, not sidebar polling, to reduce wait
- Sidebar event chain is much faster by using TextFinder instead of a manual search
- Fixed issues where non-name values would match and cross-sheet refs

## 2024-04-28
- Pool: Calculate the 'Category' Column based on type and color_identity
- Added Commander sets since they can be in set boosters
- Fixed Battle Icons

## 2024-04-26
- Changed SetStats queries to write the data to the cells as direct trigger, not recalculate
- Add Neptyne to try Python out
- Updated import to add emoji
- Cleaned out old function implementations
- Changed draw cards to write the data to the cells as direct trigger, not recalculate
