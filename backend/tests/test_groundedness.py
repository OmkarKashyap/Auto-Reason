from app.groundedness.service import check_groundedness


def test_exact_substring_is_fully_grounded():
    grounded, score = check_groundedness(
        "the mitochondria is the powerhouse of the cell",
        "Everyone knows the mitochondria is the powerhouse of the cell, right?",
    )
    assert grounded is True
    assert score == 1.0


def test_case_and_whitespace_are_normalized():
    grounded, score = check_groundedness(
        "  The   Mitochondria IS the Powerhouse  ",
        "the mitochondria is the powerhouse of the cell",
    )
    assert grounded is True
    assert score == 1.0


def test_fabricated_quote_is_not_grounded():
    grounded, score = check_groundedness(
        "penguins can fly faster than jets",
        "The mitochondria is the powerhouse of the cell.",
    )
    assert grounded is False
    assert score < 0.9


def test_close_paraphrase_above_threshold_is_grounded():
    grounded, score = check_groundedness(
        "mitochondria is powerhouse of cell",
        "The mitochondria is the powerhouse of the cell.",
        threshold=70.0,
    )
    assert grounded is True
    assert score >= 0.7


def test_empty_evidence_is_not_grounded():
    grounded, score = check_groundedness("", "Some source text.")
    assert grounded is False
    assert score == 0.0


def test_threshold_is_respected():
    evidence = "completely unrelated made up sentence about spaceships"
    source = "This text is about gardening and vegetables."
    grounded, score = check_groundedness(evidence, source, threshold=99.0)
    assert grounded is False
    assert score < 0.99
