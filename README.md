# Gene Game

A tiny number-guessing game used to practice the guess/feedback loop.

## How it works

1. `generate_target()` picks a secret number between 1 and 100.
2. `check_guess(target, guess)` tells you whether your guess was too low, too high, or correct.
3. `play_round(target, guesses)` plays through a list of guesses and returns how many it took before winning.

## Running tests

```
pytest
```
