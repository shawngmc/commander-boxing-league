
# Preexisting
Ideally, we could get tagging data from Scryfall's Tagger project. However, there is no API for this data.

# Programmatic
The oracle text and keywords may allow for some tagging...

# Crime
DIFFICULT, because there are so many variations! https://mtg.fandom.com/wiki/Committing_a_crime
Draft rules:
- Oracle Text
  - base matches
    - target (MODIFIER) OBJECT (COMPLEX MODIFIER)
    - "any target"
    - enchant (MODIFIER) OBJECT
  - OBJECT types (also need plurals):
    - land
    - creature
    - planeswalker
    - permanent
    - player
    - opponent
    - battle
    - enchantment
    - artifact
    - token
    - library
    - card
    - spell
    - ability
  - OBJECT conjunctions:
    - X or Y
    - X and Y
  - MODIFIERS:
    - Color
      - nonwhite
      - nonblack
      - nonblue
      - nonred
      - nongreen
      - white
      - black
      - blue
      - red
      - green
      - monocolored
      - multicolored
    - Type
      - Creature: creature/noncreature
      - Enchantment: enchantment/nonenchantment
      - Artifact: artifact/nonartifact
      - Legendary: legendary/nonlegendary
      - Basic: basic/nonbasic
      - Historic: historic/nonhistoric
      - Equipment: Equipment/non-Equipment
      - Aura: Aura/non-Aura
      - Creature Types: ANY/non-ANY
    - Quantity
      - up to N
      - N or more
    - Ownership
      - your _MAKES IT NOT A CRIME_
  - MODIFIER conjunctions
    - X or Y (OR: eg, red or green spell)
    - X, Y or Z (MULTI OR: eg, enchantment, creature or artifact spell)
    - X Y (AND: eg, multicolored creature spell)
  - COMPLEX MODIFIERS:
    - Keywording
      - with KEYWORD
    - Ownership
      - you control _MAKES IT NOT A CRIME_
      - you don't control
  - COMPLEX MODIFIER
    - X or Y (OR: eg, with flying or reach)
    - X Y (AND: eg, with flying you control)
## Draw
EASY
- Oracle Text
  - Draw _But not 'drawn'_
## Tutor
EASY
- Oracle Text
  - 'search your library'
- Keyword
  - *cycling
## Card Selection
- Keyword
  - Surveil
  - Scry
## Ramp
## Cost Reduction
## Pump
