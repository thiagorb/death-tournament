## Next Steps

-   balance

## Feature ideas

-   add more people types (different clothes, women, etc)
-   make dog stop and change direction
-   move view sideways

## Performance improvement ideas

-   Use one mesh per background building layer / window layer instead of one per building / window
    ... or even better: render the background as image using normal canvas API

## Size reduction ideas

-   add option to make animations loop, and remove trigger to restart animation
-   remove unused animations (person/dog, walk/rest)
-   generate draw function during svg parsing

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
