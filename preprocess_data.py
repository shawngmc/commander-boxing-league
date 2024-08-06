import csv
from datetime import datetime
import json
import os
import requests
from urllib.parse import urlparse

# Get latest bulk file URL
print("Reading scryfall bulk data API options...")
bulk_data_api_response = requests.get("https://api.scryfall.com/bulk-data")
bulk_data_options = bulk_data_api_response.json()['data']
default_card_option = [item for item in bulk_data_options if item["type"] == "default_cards"][0]
default_card_url = default_card_option['download_uri']

# Read bulk file
parsed_url = urlparse(default_card_url)
data_filename = os.path.basename(parsed_url.path)
cards = None
if (os.path.exists(data_filename)):
    print("Bulk data file already exists. Skipping download...")
    with open(data_filename, "r", encoding = "utf-8") as bulk_file:
        in_data = bulk_file.read()
        print(f"Reading input data with length: {len(in_data)}")
        cards = json.loads(in_data)
else:
    print("Reading scryfall bulk data default_cards collection from server and saving...")
    default_cards_response = requests.get(default_card_url)
    print(f"Reading input data with length: {len(default_cards_response.text)}")
    cards = default_cards_response.json()
    with open(data_filename, "w", encoding = "utf-8") as bulk_file:
        bulk_file.write(json.dumps(cards, indent=None))

print(f"Bulk card count: {len(cards)}")

standard_sets = [
    "BLB",
    "BLC",
    "OTJ",
    "OTP",
    "BIG",
    "MKM",
    "MKC",
    "LCI",
    "LCC",
    "REX",
    "WOE",
    "WOC",
    "WOT",
    "MAT",
    "MOM",
    "MOC",
    "MUL",
    "ONE",
    "ONC",
    "BRO",
    "BRC",
    "BRR",
    "BOT",
    "DMU",
    "DMC",
    "SPG",
    "PLST"
]

# Add cards from standard sets to new list
# - Do not use legality, since we aren't using the banlist
# - Do not include the List (PLST) for now
print("Filtering cards by set...")
filtered_cards = []
for card in cards:
    if card['set'].upper() in standard_sets:
        filtered_cards.append(card)

print(f"Filtered cards count: {len(filtered_cards)}")

# Remove non-paper cards
print("Removing non-paper cards...")
for card in filtered_cards:
    if "paper" not in card['games']:
        filtered_cards.remove(card)

# Transforms to make data 1-D
print("Transforming card objects by merging array keys...")
def transform_card(card):
    if 'multiverse_ids' in card and len(card['multiverse_ids']) > 0:
        card['multiverse_id'] = card['multiverse_ids'][0]
    merge_array_keys = {
        "colors": "", 
        "color_indicator": "", 
        "color_identity": "", 
        "produced_mana": "",
        "keywords": ", "
    }
    for merge_array_key, join_val in merge_array_keys.items():
        if merge_array_key in card:
            card[merge_array_key] = join_val.join(card[merge_array_key])


for card in filtered_cards:
    transform_card(card)
    if 'card_faces' in card:
        for card_face in card['card_faces']:
            transform_card(card_face)


# Trim card objects to reduce data size
clean_list = [
    "multiverse_ids",
    "all_parts",
    "reserved",
    "foil",
    "nonfoil",
    "related_uris",
    "purchase_uris",
    "prices",
    "legalities",
    "artist",
    "artist_ids",
    "illustration_id",
    "border_color",
    "frame",
    "full_art",
    "textless",
    "story_spotlight",
    "card_back_id",
    "prints_search_uri",
    "set_id",
    "promo",
    "oversized",
    "reprint",
    "finishes",
    "image_uris",
    "games",
    "layout",
    "variation",
    "highres_image",
    "image_status",
    "mtgo_id",
    "mtgo_foil_id",
    "digital",
    "frame_effects",
    "penny_rank",
    "set_name",
    "released_at",
    "scryfall_set_uri",
    "set_uri",
    "set_search_uri",
    "preview",
    "promo_types",
    "cardmarket_id",
    "arena_id",
    "lang",
    "security_stamp",
    "watermark",
    "tcgplayer_id",
    "flavor_text",
    "object",
    "uri",
    "rulings_uri",
    "booster",
    "set_type",
    "printed_name",
    "printed_type_line",
    "printed_text",
    "flavor_name",
    "variation_of",
    "tcgplayer_etched_id",
    "scryfall_uri",
    "image_uris_2"
]

face_copy_keys = ["cmc", "colors", "image_uris", "mana_cost", "oracle_text", "power", "toughness", "type_line"]

color_abbrev_dict = {
    "W": "White",
    "U": "Blue",
    "B": "Black",
    "R": "Red",
    "G": "Green"
}

print("Cleaning unused card data...")
for card in filtered_cards:

    # Collapse card faces
    if 'card_faces' in card:
        card['is_double_faced'] = True
        face_one = card['card_faces'][0]
        for key in face_copy_keys:
            if key in face_one:
                card[key] = face_one[key]
        face_two = card['card_faces'][1]
        for key in face_copy_keys:
            if key in face_two:
                card[f"{key}_2"] = face_two[key]
        del card['card_faces']

    # Keep the border-crop URL only
    if 'image_uris' in card:
        card['border_crop_image_uri'] = card['image_uris']['border_crop']
    if 'image_uris_2' in card:
        card['border_crop_image_uri_2'] = card['image_uris_2']['border_crop']


    # Keep the edhrec URI
    if 'related_uris' in card:
        if 'edhrec' in card['related_uris']:
            card['edhrec_url'] = card['related_uris']['edhrec']
        if 'gatherer' in card['related_uris']:
            card['gatherer_url'] = card['related_uris']['gatherer']
    if 'scryfall_uri' in card:
        # Reorder the scryfall URI
        card['scryfall_url'] = card['scryfall_uri']

    for key in clean_list:
        if key in card:
            del card[key]

    # Add the 'emoji-type' and category (for row coloring)
    emoji_type = ""
    category = ""
    if 'type_line' in card:
        type_line = card['type_line']
        outlaw_types = ['Assassin', 'Rogue', 'Warlock', 'Mercenary', 'Pirate']
        
        if 'Battle' in type_line:
            emoji_type += "⚔️"
        if "Creature" in type_line:
            if any(outlaw_type in type_line for outlaw_type in outlaw_types):
                emoji_type += "🤠"
            else:
                emoji_type += "🙂"
            if "Artifact" in type_line:
                emoji_type += "🔨"
                category = "Artifact"
            if "Mount" in type_line:
                emoji_type += "🐴"
        else:
            if 'Artifact' in type_line:
                emoji_type += "🔨"
                category = "Artifact"
                if 'Vehicle' in type_line:
                    emoji_type += "🚗"
                if 'Equipment' in type_line:
                    emoji_type += "🔪"
            if 'Instant' in type_line:
                emoji_type += "⚡"
                if 'oracle_text' in card and 'Spree' in card['oracle_text']:
                    emoji_type += "🤹‍♀️"
            elif 'Sorcery' in type_line:
                emoji_type += "✨"
                if 'oracle_text' in card and 'Spree' in card['oracle_text']:
                    emoji_type += "🤹‍♀️"
            elif 'Planeswalker' in type_line:
                emoji_type += "🧙‍♂️"
            elif 'Enchantment' in type_line:
                emoji_type += "🎉"
            elif 'Land' in type_line:
                emoji_type += "🗻"
                category = "Land"
            if 'oracle_text' in card and any(plot_term in card['oracle_text'] for plot_term in ['Plot', 'plot', 'plotted']):
                emoji_type += "📜"
    card['emoji_type'] = emoji_type
    if category != "Land":
        color_identity =  card['color_identity'].strip()
        if len(color_identity) > 1:
            category = "Multi"
        elif len(color_identity) == 0:
            category = "Colorless"
        else:
            category = color_abbrev_dict.get(color_identity)
    card['category'] = category
    
# Make a CSV
print("Creating modified CSV dataset...")

# Get all card keys (column headers)
keys = []
for card in filtered_cards:
    card_keys = card.keys()
    for card_key in card_keys:
        if card_key not in keys:
            keys.append(card_key)

# Write the CSV
with open(f"otj-boxing-cards.csv", 'w', newline='', encoding = "utf-8") as output_file:
    dict_writer = csv.DictWriter(output_file, keys)
    dict_writer.writeheader()
    dict_writer.writerows(filtered_cards)

print("The updated key list is: ")
print("\"" + "\", \"".join(keys) + "\"")
