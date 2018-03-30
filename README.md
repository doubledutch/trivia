# Trivia

## Data Model

### Firebase Database

This extension connects to a simple firebase database via
[@doubledutch/firebase-connector](https://www.npmjs.com/package/@doubledutch/firebase-connector)
on a per-event basis.

#### `private/admin`

```json
{
  "sessions": {
    ":sessionId": {
      "name": "Keynote Trivia",
      "secondsPerQuestion": 30
    }
  },
  "questions": {
    ":questionId": {
      "sessionId": ":sessionId",
      "order": 0,
      "text": "What biological class do owls belong to?",
      "answers": ["Mammals", "Birds", "Reptiles", "Fish"],
      "answerIndex": 1
    }
  }
}
```
