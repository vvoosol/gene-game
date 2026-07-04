from gene_game import check_guess, play_round


def test_check_guess_too_low():
    assert check_guess(50, 10) == "too low"


def test_check_guess_too_high():
    assert check_guess(50, 90) == "too high"


def test_check_guess_correct():
    assert check_guess(50, 50) == "correct"


def test_play_round_finds_target_on_correct_guess():
    assert play_round(50, [10, 90, 50]) == 3
