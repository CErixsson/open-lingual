# Lesson Schema v2 – 4-Phase Performance Model

## Principles

1. **Descriptors are NEVER tested directly** — they are validated outcomes
2. **Lessons train ability** — through vocabulary, grammar, and practice
3. **System validates ability** — through Phase 4 performance evaluation  
4. **Descriptors certify ability** — marked as Achieved when thresholds are met

## Phase Structure

### Phase 1 – Build (Input)
- Teach key vocabulary with translations and examples
- Explain grammar structures with clear rules
- Provide example sentences in context

Block types: `vocabulary`, `text`

### Phase 2 – Controlled Practice
- Fill-in-the-blank (cloze)
- Multiple choice
- Sentence reordering
- Focus on accuracy, not production

Block types: `multiple_choice`, `cloze`, `order_words`

### Phase 3 – Guided Production
- Short open response tasks
- Hints are allowed
- Must use target grammar
- Minimum word count enforced

Block types: `open_response` (with `hints` and `required_grammar`)

### Phase 4 – Free Performance Task
- Fully open production
- No hints provided
- Real communicative prompt
- Evaluated for grammar, vocabulary, structure, fluency
- Scores determine descriptor achievement

Block types: `open_response` (with `evaluation_criteria`, no hints)

## Descriptor Mapping

Each lesson's `descriptor_ids` array references CEFR descriptor IDs.
The lesson trains users toward being able to perform those descriptors.

## JSON Example

```json
{
  "id": "uuid",
  "title": "Lesson Title",
  "description": "What the lesson teaches",
  "language": "es",
  "level": "A1",
  "tags": ["greetings"],
  "objectives": ["Greet people"],
  "descriptor_ids": [1151],
  "phases": [
    {
      "phase": 1,
      "type": "build",
      "title": "Key Vocabulary",
      "blocks": [...]
    },
    {
      "phase": 2,
      "type": "controlled_practice",
      "title": "Practice",
      "blocks": [...]
    },
    {
      "phase": 3,
      "type": "guided_production",
      "title": "Guided Writing",
      "blocks": [...]
    },
    {
      "phase": 4,
      "type": "free_performance",
      "title": "Performance Task",
      "blocks": [...]
    }
  ],
  "version": "2.0.0",
  "license": "CC-BY-SA-4.0"
}
```
