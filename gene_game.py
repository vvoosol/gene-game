import random


def generate_target(low=1, high=100):
    return random.randint(low, high)


def check_guess(target, guess):
    if guess < target:
        return "too low"
    if guess > target:
        return "too high"
    return "correct"


def play_round(target, guesses):
    for guess in guesses:
        result = check_guess(target, guess)
        if result == "correct":
            return len(guesses[: guesses.index(guess) + 1])
    return None
