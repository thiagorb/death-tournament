## Next Steps

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

-   Once logged in, the player handle will be stored
-   After playing for a while, a player will eventually be able to see players from the same level as them in their game
-   Killing the other player will allow you to get their weapon
-   There will be different weapon skins (would also be nice if they can have special skills, like a dash move)

Requirements

-   It should be possible to render different weapons for the death
    To acchieve this it should be possible to extract the transform matrix for a given component in the model.
    Then the death model should have either an empty path, or a placeholder path, instead of the weapon.
    Then, the rendering of the death must be modified, so that it renders its parts independently:

        - First all transforms are calculated
        - Then the left arm is rendered
        - Then the weapon is rendered
        - Then the rest

    This will add quite a lot of logic to render the death, but it will also allow removing the left model,
    since it is used only to render the weapon in a different place

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
