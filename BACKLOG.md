## Next Steps

-   Add opponent health bar with opponent's name
-   Add indicator for hits on opponent
-   Make weapon colors change stats (better snaths increase defense, better blades increase attack)
-   Make probability of scythe inversely proportional to how good it is

## Feature ideas

-   add more people types (different clothes, women, etc)
-   make dog stop and change direction

## Performance improvement ideas

-   automatically increase pixel size if fps is dropping

## Size reduction ideas

-   add option to make animations loop, and remove trigger to restart animation
-   replace object instantiation with array
-   reduce coordinate precision in svg-loader (maybe exporting coordinates scaled up by 10x as ints, then scaling down after)

## New NEAR Idea

-   Once logged in, the player handle will be stored in NEAR so that other player can find it
-   There will be different weapon skins (would also be nice if they can have special skills, like a dash move)
-   Contracts will store player names, and their weapon
-   Upon starting a game the player will have the chance to see another player in their game, through an AI-controlled character
-   Killing the other player's character will allow you to get their weapon
-   There should be a pool of weapons that can be found initially
-   The weapons will be associated with bots
-   A random weapon will be selected from the pool (from bots or player), and a character holding this weapon will appear in the game
-   The player will then be able to get the weapon after killing this character

## NEAR Idea

### Contract calls

-   getChests(): [Chest, Chest, Chest]

    List chests and slots information for logged in player.

-   receiveChest(): void

    Should be called only if the user has available chest slots.
    Called after a game ends.

-   openChest(slot: 1 | 2 | 3): void

    Starts opening a chest. A timestamp will be generated (now + 30 minutes for example).
    After the time the user is able to collect the chest.

-   openChest(slot: 1 | 2 | 3): void

-   Logged in players can:
    -   Collect chests
        A player is allowed to get a chest after each game with maximum of 3 chests
        Each collected chest makes a call to
    -   Player is able to start opening the chest
    -
