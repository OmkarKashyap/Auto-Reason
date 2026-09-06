"""Golden dataset for evaluating extraction quality."""
from dataclasses import dataclass


@dataclass
class GoldenExample:
    name: str
    text: str
    expected_entities: list[str]
    expected_relationships: list[tuple[str, str, str]]  # (source, relation, target)


GOLDEN_DATASET: list[GoldenExample] = [
    GoldenExample(
        name="simple_single_relationship",
        text="Photosynthesis converts sunlight into chemical energy stored in glucose.",
        expected_entities=["Photosynthesis", "Sunlight", "Chemical energy", "Glucose"],
        expected_relationships=[
            ("Photosynthesis", "converts", "Chemical energy"),
            ("Chemical energy", "stored in", "Glucose"),
        ],
    ),
    GoldenExample(
        name="multi_entity_achievements",
        text=(
            "Marie Curie discovered radium and polonium. She was awarded the Nobel "
            "Prize in Physics in 1903 and the Nobel Prize in Chemistry in 1911."
        ),
        expected_entities=[
            "Marie Curie",
            "Radium",
            "Polonium",
            "Nobel Prize in Physics",
            "Nobel Prize in Chemistry",
        ],
        expected_relationships=[
            ("Marie Curie", "discovered", "Radium"),
            ("Marie Curie", "discovered", "Polonium"),
            ("Marie Curie", "awarded", "Nobel Prize in Physics"),
            ("Marie Curie", "awarded", "Nobel Prize in Chemistry"),
        ],
    ),
    GoldenExample(
        name="coreference_mitochondria",
        text=(
            "The mitochondria is the powerhouse of the cell. It produces ATP "
            "through cellular respiration."
        ),
        expected_entities=["Mitochondria", "Cell", "ATP", "Cellular respiration"],
        expected_relationships=[
            ("Mitochondria", "is the powerhouse of", "Cell"),
            ("Mitochondria", "produces", "ATP"),
            ("Mitochondria", "performs", "Cellular respiration"),
            ("ATP", "produced through", "Cellular respiration"),
        ],
    ),
    GoldenExample(
        name="vague_no_content_1",
        text="Things happen sometimes and stuff occurs.",
        expected_entities=[],
        expected_relationships=[],
    ),
    GoldenExample(
        name="causal_chain_climate",
        text="Deforestation increases atmospheric CO2 levels, which causes global warming.",
        expected_entities=["Deforestation", "Atmospheric CO2 levels", "Global warming"],
        expected_relationships=[
            ("Deforestation", "increases", "Atmospheric CO2 levels"),
            ("Atmospheric CO2 levels", "causes", "Global warming"),
        ],
    ),
    GoldenExample(
        name="org_founding",
        text=(
            "OpenAI was founded by Sam Altman and others in 2015. The company "
            "created ChatGPT, a conversational AI product."
        ),
        expected_entities=["OpenAI", "Sam Altman", "ChatGPT"],
        expected_relationships=[
            ("Sam Altman", "founded", "OpenAI"),
            ("OpenAI", "created", "ChatGPT"),
        ],
    ),
    GoldenExample(
        name="historical_event",
        text=(
            "World War II began in 1939 when Germany invaded Poland. The war "
            "ended in 1945 with the surrender of Japan."
        ),
        expected_entities=["World War II", "Germany", "Poland", "Japan"],
        expected_relationships=[
            ("Germany", "invaded", "Poland"),
            ("World War II", "ended with", "Japan"),
        ],
    ),
    GoldenExample(
        name="technical_software",
        text=(
            "React is a JavaScript library for building user interfaces. It was "
            "created by Facebook and is now maintained by Meta."
        ),
        expected_entities=["React", "JavaScript", "Facebook", "Meta"],
        expected_relationships=[
            ("Facebook", "created", "React"),
            ("Meta", "maintains", "React"),
        ],
    ),
    GoldenExample(
        name="health_exercise",
        text="Regular exercise reduces the risk of heart disease and improves mental health.",
        expected_entities=["Regular exercise", "Heart disease", "Mental health"],
        expected_relationships=[
            ("Regular exercise", "reduces", "Heart disease"),
            ("Regular exercise", "improves", "Mental health"),
        ],
    ),
    GoldenExample(
        name="geography_river",
        text=(
            "The Amazon River flows through Brazil and is the largest river by "
            "discharge volume in the world."
        ),
        expected_entities=["Amazon River", "Brazil", "World"],
        expected_relationships=[
            ("Amazon River", "flows through", "Brazil"),
            ("Amazon River", "is the largest river by discharge volume in", "World"),
        ],
    ),
    GoldenExample(
        name="coreference_newton",
        text=(
            "Isaac Newton formulated the laws of motion. His work laid the "
            "foundation for classical mechanics."
        ),
        expected_entities=["Isaac Newton", "Laws of motion", "Classical mechanics"],
        expected_relationships=[
            ("Isaac Newton", "formulated", "Laws of motion"),
            ("Laws of motion", "laid the foundation for", "Classical mechanics"),
        ],
    ),
    GoldenExample(
        name="vague_no_content_2",
        text="It was a nice day.",
        expected_entities=[],
        expected_relationships=[],
    ),
]
