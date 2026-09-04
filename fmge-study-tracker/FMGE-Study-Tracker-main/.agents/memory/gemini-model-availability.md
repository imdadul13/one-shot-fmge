---
name: Gemini model availability
description: Compatibility lesson for Gemini API model selection in this workspace environment.
---

When a newly provisioned Gemini API key rejects an otherwise valid model ID, trust the provider's live error message for the replacement model instead of repeatedly retrying the older model.

**Why:** The environment accepted the key but returned a model-availability error for an older Flash model; the provider identified a newer Flash model that worked immediately.

**How to apply:** Keep the backend model ID and any user-facing model label in sync, then restart the API workflow before retesting.