# Lesson Schema v3 – Duolingo-Style Exercise Model

## Architecture

```
Descriptor (CEFR Can-Do statement)
  → Skill Module (focused learning unit)
    → Lesson (3-5 min session, 8-12 exercises)
      → Exercise (single interactive task)
```

## Key Principles

1. **Lessons are JSON files** – not stored in database
2. **Descriptors are outcome markers** – they certify ability, NOT lesson content
3. **Start easy** – A1 lessons use recognition before production
4. **Varied exercise types** – keeps engagement high
5. **Each lesson = 8-12 exercises** – takes ~3-5 minutes

## Exercise Types

### `vocabulary_intro`
Show new words with translations and example sentences.
```json
{
  "type": "vocabulary_intro",
  "items": [
    { "word": "Hallo", "translation": "Hello", "example": "Hallo, wie geht's?" }
  ]
}
```

### `multiple_choice`
Pick the correct answer from options.
```json
{
  "type": "multiple_choice",
  "prompt": "What does 'Hallo' mean?",
  "options": ["Hello", "Goodbye", "Please"],
  "correct": 0
}
```

### `translate`
Translate a word or short phrase (user types or picks).
```json
{
  "type": "translate",
  "prompt": "Translate to English:",
  "source": "Guten Morgen",
  "answer": "Good morning",
  "alternatives": ["good morning"]
}
```

### `match_pairs`
Match words to their translations (drag or tap).
```json
{
  "type": "match_pairs",
  "pairs": [
    { "left": "Hello", "right": "Hallo" },
    { "left": "Goodbye", "right": "Tschüss" }
  ]
}
```

### `fill_blank`
Complete a sentence by choosing the correct word.
```json
{
  "type": "fill_blank",
  "sentence": "Ich ___ Anna.",
  "answer": "heiße",
  "options": ["heiße", "bin", "komme"]
}
```

### `word_order`
Arrange words into the correct sentence.
```json
{
  "type": "word_order",
  "prompt": "Arrange into a sentence:",
  "words": ["heiße", "Anna", "Ich"],
  "correct_order": [2, 0, 1]
}
```

### `listen_type` (future)
Listen to audio and type what you hear.

### `speak` (future)
Say the sentence aloud (microphone required).

## Lesson JSON Format

```json
{
  "id": "en-a1-greetings-1",
  "title": "Greetings 1",
  "description": "Learn to say hello and goodbye",
  "language": "en",
  "level": "A1",
  "module_id": "basic-greetings",
  "descriptor_ids": ["sociolinguistic-appropriateness"],
  "xp": 10,
  "exercises": [ ... ]
}
```

## File Structure

```
public/data/curriculum/
├── skill-modules.json        # Module definitions
├── lessons/
│   ├── en/
│   │   ├── A1/
│   │   │   ├── index.json    # ["greetings-1.json", "introductions-1.json"]
│   │   │   ├── greetings-1.json
│   │   │   └── introductions-1.json
│   │   └── A2/
│   ├── de/
│   │   ├── A1/
│   │   │   ├── index.json
│   │   │   ├── greetings-1.json
│   │   │   └── introductions-1.json
```
