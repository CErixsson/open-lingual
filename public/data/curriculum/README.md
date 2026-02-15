# Open Lingual Curriculum (CC-BY-SA-4.0)

Open-source language learning content for the [Open Lingual](https://open-speak-buddy.lovable.app) platform.

## Structure

```
curriculum/
├── descriptors.json        # CEFR 2020 Can-Do statements (universal)
├── languages.json           # Supported languages
├── lessons/
│   ├── es/                  # Lessons by language code
│   │   ├── A1/
│   │   │   └── greetings.json
│   │   └── A2/
│   ├── fr/
│   └── en/
├── exercises/
│   ├── es/                  # Exercises by language code
│   │   └── exercises.json
│   └── fr/
└── scenarios/
    ├── ar/                  # Dialogue scenarios by language code
    │   └── scenarios.json
    └── es/
```

## JSON Schemas

### descriptors.json
Each descriptor is a CEFR 2020 "Can-Do" statement — a universal pedagogical constant.

```json
{
  "id": 1,
  "level": "C2",
  "scale": "Overall oral comprehension",
  "activity": "Oral comprehension",
  "scheme": "Communicative language activities",
  "mode": "Reception",
  "descriptor_number": 1,
  "descriptor_text": "Can understand with ease virtually any kind of language..."
}
```

### lessons/{lang}/{level}/{slug}.json
Lessons teach CEFR descriptor meanings using instructional language (e.g., English).

```json
{
  "id": "uuid",
  "title": "Spanish Basics: Greetings",
  "description": "Learn essential Spanish greetings and introductions.",
  "language": "es",
  "level": "A1",
  "tags": ["greetings", "basics"],
  "objectives": ["Greet people in Spanish", "Introduce yourself"],
  "exercises": [ ... ],
  "version": "1.0.0",
  "license": "CC-BY-SA-4.0"
}
```

### exercises/{lang}/exercises.json
Exercises are linked to CEFR descriptors and have ELO difficulty ratings.

```json
{
  "descriptor_id": 1,
  "language_code": "es",
  "exercise_type": "multiple_choice",
  "difficulty_elo": 1200,
  "content": { ... }
}
```

### scenarios/{lang}/scenarios.json
Dialogue scenarios for conversational practice.

```json
{
  "title": "Buying a train ticket",
  "cefr_target": "A1",
  "topic": "travel",
  "difficulty_elo": 1000,
  "grammar_targets": [],
  "vocabulary_clusters": [],
  "cultural_notes": null,
  "nodes": [ ... ]
}
```

## Contributing

1. Fork this repo
2. Edit or add JSON files following the schemas above
3. Submit a Pull Request
4. On merge, a GitHub Action syncs content to the production database

## License

All curriculum content is licensed under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/).
