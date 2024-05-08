//@OnlyCurrentDoc

/*global SpreadsheetApp*/
/*global HtmlService*/
/*global CacheService*/

/*global SCRYFALL*/

/***********************************************************************
Card Sidebar
***********************************************************************/

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('MTG Tools')
      .addItem('Open Card View', 'showSidebar')
      .addToUi();
}

function showSidebar() {
  // You can use a template to inject initialization data
  var html = HtmlService
      .createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle('Card View')
      .setWidth(300);

  SpreadsheetApp.getUi()
      .showSidebar(html);
}

function onSelectionChange() {
  // Update the cached selected card
  const cache = CacheService.getUserCache();
  const selected_value = SpreadsheetApp.getActiveRange().getValue();
  console.log('checking cache');
  let card = cache.get('selectedCard');
  if (card != null) {
    card = JSON.parse(card);
    if (card != null && 'name' in card && card['name'] === selected_value) {
      // No need to update cache
      return;
    }
  }
  console.log('getting card');
  card = getCardByName(selected_value);
  console.log(card);
  cache.put('selectedCard', JSON.stringify(card));
}

function getCurrentSelectedCard() {
  var cache = CacheService.getUserCache();
  let card = cache.get('selectedCard');
  console.log(card);
  if (card !== null) {
    card = JSON.parse(card);
  }
  console.log(card);
  return card;
}

function getCardByName(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("ImportedScryfall");
  const matchRange = sheet.getRange('C:C')
    .createTextFinder(name)
    .matchEntireCell(true)
    .findNext();
  if (matchRange !== null) {
    let card_data = sheet.getRange(`${matchRange.getRowIndex()}:${matchRange.getRowIndex()}`).getValues().flat();
    return mapScryfallCard(card_data);
  } else {
    return null;
  }
}

/***********************************************************************
Card Name Link
***********************************************************************/

// This function provides all the search nuances of each platform when linking to an individual card by name only.
function getCardDBLinkByName(card_db, card_name) {
  if (card_db === null || card_db === undefined || card_db.trim() === "") {
    throw new Error("Missing Card DB");
  } else if (card_name === null || card_name === undefined || card_name.trim() === "") {
    throw new Error("Missing Card Name");
  } else {
    const canonical_card_db = card_db.trim().toLowerCase();
    let search_name = card_name;
    switch (canonical_card_db) {
      case "scryfall":
        // Scryfall specifically calls out URI encoding, but also uses ! to denote exact and "" to account for spaces
        search_name = encodeURIComponent(search_name);
        return `https://scryfall.com/search?&unique=cards&as=grid&order=name&q=!"${search_name}"`;
      case "edhrec":
        // EDHRec uses lowercase and does a few character replacements
        search_name = card_name.toLowerCase();
        search_name = search_name.replaceAll(" ", "-");
        search_name = search_name.replaceAll(",", "");
        search_name = search_name.replaceAll("'", "");
        return `https://edhrec.com/cards/${search_name}`;
      case "tcgplayer":
        // TCGPlayer appears to just need spaces replaced with plus signs
        search_name = card_name.replaceAll(" ", "+");
        return `https://www.tcgplayer.com/search/all/product?productLineName=magic&q=${search_name}&view=grid`;
      case "deckbox":
        // Deckbox appears to just need URI encoding
        search_name = encodeURIComponent(search_name);
        return `https://deckbox.org/mtg/${search_name}?fromqs=true`;
      default:
        throw new Error("Invalid Card DB");
    }
  } 
}

/***********************************************************************
Scryfall Query Helpers
***********************************************************************/

function fillAllScryfallQueries() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('SetStats');

  for (let row = 2; row < 30; row++) {
    const setAbbr = sheet.getRange(row, 2).getValues()[0][0];
    if (setAbbr != undefined && setAbbr.trim() != "") {
      for (let column = 4; column < 28; column++) {
        const query = sheet.getRange(29, column).getValues()[0][0];
        if (query != undefined && query.trim() != "") {
          const fullQuery = `(game:paper) set:${setAbbr} ${query}`;
          const outputCell = sheet.getRange(row, column);
          const count = countScryfallMatches(fullQuery);
          const url = linkToScryfallQuery(fullQuery);
          var richValue = SpreadsheetApp.newRichTextValue()
            .setText(count)
            .setLinkUrl(url)
            .build();
          outputCell.setRichTextValue(richValue);
        }
      }
    }
  }
}

function countScryfallMatches(query) {
  try {
    let results = SCRYFALL(query, "name");
    return results.length;
  } catch (error) {    
    if (error.toString().includes("404")) {
      return 0;
    } else {
      console.log(`Failed on query: ${query}`);
      throw error;
    }
  }
}

function linkToScryfallQuery(query) {
  return `https://scryfall.com/search?as=grid&order=name&q=${encodeURIComponent(query)}`;
}

/***********************************************************************
DeckList/Test Hand Functions
***********************************************************************/

function createDeckList() {
  const sheet = SpreadsheetApp.getActive().getActiveSheet();
  let cards = [];
  
  // Get the normal card range
  let uniqueCards = sheet.getRange(DEFAULT_DECK_RANGES['card_list']).getValues().flat();
  for (var idx in uniqueCards) {
    if (uniqueCards[idx].trim().length > 0) {
      cards.push(uniqueCards[idx].trim());
    }
  }

  // Add the basic lands
  let basicLandValues = sheet.getRange(DEFAULT_DECK_RANGES['basic_lands']).getValues();
  for (var row in basicLandValues) {
    for (let i = 0; i < basicLandValues[row][1]; i++) {
      cards.push(basicLandValues[row][0]);
    }
  }

  let commanders = sheet.getRange(DEFAULT_DECK_RANGES['commander_list']).getValues().flat();
  for (let i = 0; i < commanders.length; i++) {
    var index = cards.indexOf(commanders[i]);
    if (index !== -1) {
      cards.splice(index, 1);
    }
  }

  return cards;
}

function pullHandAndFiveDraws(cards) {
  let draws = [];
  for (let i = 0; i < 12; i++) {
    let drawIndex = Math.floor(Math.random() * cards.length);
    draws.push(cards[drawIndex]);
    cards.splice(drawIndex, 1);
  }
  return draws;
}

const DEFAULT_DECK_RANGES = {
  "card_list": "A2:A82",
  "basic_lands": "L3:M7",
  "draw_output_start": "P16",
  "color_identity_output": "M28",
  "commander_list": "P6:P7"
};

function drawCardsTriggered() {
  const sheet = SpreadsheetApp.getActive().getActiveSheet();

  const cards = createDeckList();
  const draws = pullHandAndFiveDraws(cards);

  const startOutputRange = sheet.getRange(DEFAULT_DECK_RANGES['draw_output_start']);
  let start_row = startOutputRange.getRow();
  let column = startOutputRange.getColumn();
  for (let draw_idx = 0; draw_idx < draws.length; draw_idx++) {
    const outputCell = sheet.getRange(start_row + draw_idx, column);
    outputCell.setValue(draws[draw_idx]);
  }
}

function checkColorIdentityTriggered() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const deckSheet = spreadsheet.getActiveSheet();
  let deckCards = createDeckList();
  const poolCards = getPool();
  deckCards = deckCards.map(card_name => poolCards.filter(poolCard => poolCard['name'] === card_name).flat()).flat();
  let commanders = deckSheet.getRange(DEFAULT_DECK_RANGES['commander_list']).getValues().flat().filter(commander => commander);
  commanders = commanders.map(commander => getCardByName(commander));
  let rawColorIdentity = commanders.map(commander => commander['color_identity']).join("");

  // Sort the rawColorIdentity to reduce permutation concerns - we don't care about pretty data for the test :)
  rawColorIdentity = rawColorIdentity.split('').sort().join('');

  // Make every permutation of a sorted color identity of every length, without dupes
  let findPermutations = (charArray) => {
    if (charArray.length == 1) {
      return ["", charArray[0]];
    } else {
      let results = [];
      for (let i = 0; i < charArray.length; i++) {
        let subArray = [...charArray].splice(i, charArray.length - 1);
        results.push(...findPermutations(subArray));
        results.push(subArray.join(''));
      }
      results.push(charArray.join(''));
      return [...new Set(results)];
    }
  }
  const allowedColorIdentities = findPermutations(rawColorIdentity.split(''));
  console.log(`allowedColorIdentities: ${allowedColorIdentities}`);
  
  // Check every card for a valid permutation
  let badCards = [];
  deckCards.forEach(deckCard => {
    let sortedColorIdentity = deckCard['color_identity'].split('').sort().join('');
    if (!allowedColorIdentities.includes(sortedColorIdentity)) {
      badCards.push(deckCard);
    }
  });

  // Update color identity output
  const startOutputRange = deckSheet.getRange(DEFAULT_DECK_RANGES['color_identity_output']);
  if (badCards.length == 0) {
    startOutputRange.setValue("OK");
    startOutputRange.clearNote();
  } else {
    startOutputRange.setValue("Bad");
    let noteText = "";
    badCards.forEach(badCard => noteText += `${badCard['name']} has color identity ${badCard['color_identity']}\n`);
    startOutputRange.setNote(noteText);
  }
}

/***********************************************************************
Commander Listing
***********************************************************************/
const imported_scryfall_fields = ["id", "oracle_id", "name", "mana_cost", "cmc", "type_line", "power", "toughness", "colors", "color_identity", "keywords", "set", "collector_number", "rarity", "edhrec_rank", "multiverse_id", "border_crop_image_uri", "edhrec_url", "gatherer_url", "scryfall_url", "emoji_type", "category", "oracle_text", "produced_mana", "loyalty", "color_indicator"]
const pool_fields = ["name", "in_pool", "set", "rarity", "type_helper", "mana_cost", "cmc", "color_identity", "edhrec_link", "category", "count", "type_line", "rating", "scryfall_url"]
function getPool() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Pool");
  let cards = sheet.getRange("A:N").getValues();
  
  cards = cards.map(card => mapPoolCard(card));

  return cards;
}

function createNameResultList(cards) {
  return cards.map(card => {
    return [card["name"]];
  });
}

/**
 * Get the cards in the pool that can be your commander in the league
 *
 * @return                                List of potenial commanders
 * @customfunction
 */
function createCommanderList() {
  let cards = getPool();

  // Filter to owned cards
  cards = cards.filter((card) => {
    return card.count >= 1;
  })

  // Limit to cards that are legendary creatures
  cards = cards.filter((card) => {
    return (card['type_line'].indexOf("Legendary")) >= 0 && (card['type_line'].indexOf("Creature") >= 0);
  });

  // Add dual-mono permutations
  let mono_cards = cards.filter((card) => {
    return card['color_identity'].length == 1;
  });
  
  let mono_pairs = [];
  for (let i = 0; i < mono_cards.length; i++) {
    for (let j = i + 1; j < mono_cards.length; j++) {
      mono_pairs.push([mono_cards[i], mono_cards[j]])
    }
  }
  let multicolor_cards = cards.filter((card) => {
    return card['color_identity'].length > 1;
  });

  let results = [];
  results.push.apply(results, multicolor_cards.map(card => {return [card["name"], "", card["color_identity"]]}));
  for (let i = 0; i < mono_pairs.length; i++) {
    let cmdr_one = mono_pairs[i][0];
    let cmdr_two = mono_pairs[i][1];
    let color_identity = `${cmdr_one['color_identity']}${cmdr_two['color_identity']}`
    color_identity = Array.from(new Set(color_identity.split(''))).join('');
    results.push([`${mono_pairs[i][0]['name']}`, `${mono_pairs[i][1]['name']}`, `${color_identity}`])
  }

  return results;
}

/**
 * Get the cards in the pool that could have been your commander in the league, but are MIA
 *
 * @return                                List of potenial commanders that are MIA
 * @customfunction
 */
function createMissingCommanderList() {
  let cards = getPool();
  // Filter to unowned cards
  cards = cards.filter((card) => {
    return card['count'] == 0 || card['count'] === '' || card['count'] === undefined;
  })
  // Limit to cards that are legendary creatures
  cards = cards.filter((card) => {
    return (card['type_line'].indexOf("Legendary")) >= 0 && (card['type_line'].indexOf("Creature") >= 0);
  });
  return cards.map(card => {return [card["name"], card["color_identity"]]});
}

function mapScryfallCard(rawCard) {
  let obj = {};
    for (let i = 0; i < imported_scryfall_fields.length; i++) {
      obj[imported_scryfall_fields[i]] = rawCard[i];
    }
    return obj;
}

function mapPoolCard(rawCard) {
  let obj = {};
    for (let i = 0; i < pool_fields.length; i++) {
      obj[pool_fields[i]] = rawCard[i];
    }
    return obj;
}

function getScryfallImportedCards() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("ImportedScryfall");
  let cards = sheet.getDataRange().getValues();
  
  cards = cards.map(mapScryfallCard);

  return cards;
}

function getScryfallImportedCard(name) {
  const cards = getScryfallImportedCards();
  return cards.filter((card => {return card['name'] == name;}))[0]
}
