# Requirements Document

## Introduction

This feature implements database persistence for chat conversations in LibraAI. Currently, chat conversations are stored only in the browser's localStorage, which means they are lost when browser data is cleared and cannot be accessed across devices. This feature will persist conversations to MongoDB and sync them across all user sessions.

## Glossary

- **Chat System**: The LibraAI conversational AI interface that helps students find books and answer literature questions
- **Conversation**: A complete chat session containing multiple messages between the user and the AI assistant
- **Message**: A single exchange unit in a conversation (either from user or assistant)
- **Conversation History**: The list of all saved conversations for a user
- **User Session**: An authenticated user's active connection to the application

## Requirements

### Requirement 1: Database Schema for Conversations

**User Story:** As a developer, I want a MongoDB schema for storing chat conversations, so that conversation data can be persisted reliably in the database.

#### Acceptance Criteria

1. THE Chat System SHALL store conversations in a MongoDB collection named "conversations"
2. WHEN a conversation is created, THE Chat System SHALL include the following fields: userId (ObjectId reference), conversationId (unique identifier), title (string), messages (array of message objects), createdAt (timestamp), and lastUpdated (timestamp)
3. WHEN a message is stored, THE Chat System SHALL include the following fields: role (string: "user" or "assistant"), content (string), timestamp (string), hasFile (boolean), fileName (string, optional), fileType (string, optional)
4. THE Chat System SHALL create an index on userId field for efficient query performance
5. THE Chat System SHALL create an index on conversationId field for unique identification

### Requirement 2: Save Conversation API Endpoint

**User Story:** As a student user, I want my chat conversations to be automatically saved to the database, so that I can access them from any device and they won't be lost if I clear my browser data.

#### Acceptance Criteria

1. THE Chat System SHALL provide a POST endpoint at "/api/chat/conversations"
2. WHEN a user sends a save request, THE Chat System SHALL authenticate the user session
3. WHEN saving a conversation, THE Chat System SHALL accept conversationId, title, and messages in the request body
4. IF the conversation already exists for the user, THEN THE Chat System SHALL update the existing conversation
5. IF the conversation does not exist, THEN THE Chat System SHALL create a new conversation record
6. WHEN a conversation is saved successfully, THE Chat System SHALL return a success response with status 200
7. IF the user is not authenticated, THEN THE Chat System SHALL return an error response with status 401
8. IF the request data is invalid, THEN THE Chat System SHALL return an error response with status 400

### Requirement 3: Load Conversations API Endpoint

**User Story:** As a student user, I want to load all my saved conversations when I open the chat page, so that I can continue previous conversations or review past interactions.

#### Acceptance Criteria

1. THE Chat System SHALL provide a GET endpoint at "/api/chat/conversations"
2. WHEN a user requests their conversations, THE Chat System SHALL authenticate the user session
3. WHEN loading conversations, THE Chat System SHALL return all conversations belonging to the authenticated user
4. THE Chat System SHALL sort conversations by lastUpdated timestamp in descending order
5. THE Chat System SHALL limit the response to the 20 most recent conversations
6. WHEN conversations are loaded successfully, THE Chat System SHALL return a success response with status 200 and an array of conversation objects
7. IF the user is not authenticated, THEN THE Chat System SHALL return an error response with status 401

### Requirement 4: Delete Conversation API Endpoint

**User Story:** As a student user, I want to permanently delete conversations from the database, so that I can remove conversations I no longer need.

#### Acceptance Criteria

1. THE Chat System SHALL provide a DELETE endpoint at "/api/chat/conversations/:conversationId"
2. WHEN a user requests to delete a conversation, THE Chat System SHALL authenticate the user session
3. WHEN deleting a conversation, THE Chat System SHALL verify that the conversation belongs to the authenticated user
4. THE Chat System SHALL permanently remove the conversation from the database
5. WHEN a conversation is deleted successfully, THE Chat System SHALL return a success response with status 200
6. IF the user is not authenticated, THEN THE Chat System SHALL return an error response with status 401
7. IF the conversation does not belong to the user, THEN THE Chat System SHALL return an error response with status 403
8. IF the conversation does not exist, THEN THE Chat System SHALL return an error response with status 404

### Requirement 5: Client-Side Integration

**User Story:** As a student user, I want the chat interface to automatically sync with the database, so that my conversations are always up-to-date without manual intervention.

#### Acceptance Criteria

1. WHEN the chat page loads, THE Chat System SHALL fetch all conversations from the database API
2. WHEN a user sends a message, THE Chat System SHALL save the updated conversation to the database within 1 second
3. WHEN a user deletes a conversation, THE Chat System SHALL call the delete API endpoint and remove it from the database
4. WHEN a user starts a new conversation, THE Chat System SHALL create it in the database after the first user message
5. IF the API request fails, THEN THE Chat System SHALL fall back to localStorage and display an error notification to the user
6. THE Chat System SHALL maintain localStorage as a backup cache for offline access
7. WHEN the database save is successful, THE Chat System SHALL update the localStorage cache to match

### Requirement 6: Migration and Backward Compatibility

**User Story:** As a student user with existing localStorage conversations, I want my conversations to be migrated to the database, so that I don't lose my chat history.

#### Acceptance Criteria

1. WHEN a user with localStorage conversations first loads the chat page, THE Chat System SHALL detect existing localStorage conversations
2. THE Chat System SHALL migrate all localStorage conversations to the database
3. WHEN migration is complete, THE Chat System SHALL keep the localStorage data as a backup
4. IF migration fails for any conversation, THEN THE Chat System SHALL log the error and continue with remaining conversations
5. THE Chat System SHALL display a notification to the user when migration is in progress
