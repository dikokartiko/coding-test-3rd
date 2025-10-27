# Chat Page Layout Implementation Plan

## Overview

This document outlines the implementation plan for refactoring the chat page to use a Next.js layout pattern with separated components for better maintainability and code organization.

## Current Structure Analysis

The current `app/chat/page.tsx` is a monolithic component (384 lines) that handles:

- Conversation history sidebar (lines 109-182)
- Main chat interface with multiple sub-sections (lines 187-381)
- All state management and event handlers

## Proposed Architecture

### File Structure

```
app/chat/
├── layout.tsx                    # New: Chat layout with sidebar and main sections
├── page.tsx                      # Updated: Simplified page using layout
├── _components/
│   ├── chat-sidebar/
│   │   ├── index.ts
│   │   ├── ChatSidebar.tsx       # New: Extracted sidebar component
│   │   └── chat-sidebar.types.ts
│   ├── chat-main/
│   │   ├── index.ts
│   │   ├── ChatMain.tsx          # New: Main chat interface wrapper
│   │   └── chat-main.types.ts
│   ├── chat-header/
│   │   ├── index.ts
│   │   ├── ChatHeader.tsx        # New: Chat header with title and fund info
│   │   └── chat-header.types.ts
│   ├── fund-selectors/
│   │   ├── index.ts
│   │   ├── FundSelectors.tsx    # New: Fund selection controls
│   │   └── fund-selectors.types.ts
│   ├── messages-display/
│   │   ├── index.ts
│   │   ├── MessagesDisplay.tsx   # New: Messages area with loading states
│   │   └── messages-display.types.ts
│   └── chat-input-form/
│       ├── index.ts
│       ├── ChatInputForm.tsx     # New: Message input form
│       └── chat-input-form.types.ts
```

## Implementation Steps

### 1. Create Chat Layout (app/chat/layout.tsx)

```typescript
"use client";

import { ReactNode } from "react";
import { ChatSidebar } from "./_components/chat-sidebar";
import { ChatMain } from "./_components/chat-main";
import { useConversations, useMessages, useFunds, useChatUI } from "./_hooks";

export default function ChatLayout({ children }: { children: ReactNode }) {
  // Initialize all hooks at layout level
  const conversations = useConversations();
  const messages = useMessages(conversations.conversationId);
  const funds = useFunds();
  const ui = useChatUI();

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ChatSidebar
        conversations={conversations}
        funds={funds}
        onConversationSelect={async (id: string) => {
          try {
            const conversation = await conversations.handleConversationSelect(
              id
            );
            if (conversation && conversation.messages) {
              messages.setMessages(conversation.messages);
            } else {
              messages.setMessages([]);
            }
          } catch (error: any) {
            ui.setErrorMessage(
              error?.response?.data?.detail || "Unable to load conversation"
            );
          }
        }}
      />
      <ChatMain
        conversations={conversations}
        messages={messages}
        funds={funds}
        ui={ui}
        onSubmit={async (e: React.FormEvent) => {
          // Implementation from current handleSubmit
        }}
      >
        {children}
      </ChatMain>
    </div>
  );
}
```

### 2. Extract ChatSidebar Component

Extract lines 109-182 from page.tsx into `app/chat/_components/chat-sidebar/ChatSidebar.tsx`

### 3. Extract ChatMain Component

Create wrapper component that contains:

- ChatHeader (lines 194-209)
- FundSelectors (lines 214-291)
- MessagesDisplay (lines 296-349)
- ChatInputForm (lines 354-380)

### 4. Extract Individual Components

- **ChatHeader**: Lines 194-209 from page.tsx
- **FundSelectors**: Lines 214-291 from page.tsx
- **MessagesDisplay**: Lines 296-349 from page.tsx
- **ChatInputForm**: Lines 354-380 from page.tsx

### 5. Update Chat Page

Simplify page.tsx to use the layout:

```typescript
"use client";

export default function ChatPage() {
  return <div>{/* Page content if needed */}</div>;
}
```

## Component Props Interface

### ChatSidebar Props

```typescript
interface ChatSidebarProps {
  conversations: ReturnType<typeof useConversations>;
  funds: ReturnType<typeof useFunds>;
  onConversationSelect: (id: string) => Promise<void>;
}
```

### ChatMain Props

```typescript
interface ChatMainProps {
  conversations: ReturnType<typeof useConversations>;
  messages: ReturnType<typeof useMessages>;
  funds: ReturnType<typeof useFunds>;
  ui: ReturnType<typeof useChatUI>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  children?: ReactNode;
}
```

## State Management Strategy

1. **Keep hooks at layout level**: Initialize all hooks in the layout component
2. **Pass state down as props**: Each component receives the state it needs
3. **Event handlers**: Move handlers closer to the components that use them
4. **Maintain existing patterns**: Preserve current hook usage and state flow

## Styling Considerations

1. **Preserve all Tailwind classes**: Maintain existing styling exactly
2. **Responsive design**: Keep all responsive breakpoints
3. **Component-specific styles**: Keep styles with their respective components

## Testing Strategy

1. **Unit tests**: Test each component in isolation
2. **Integration tests**: Test component interactions
3. **Visual regression**: Ensure UI remains unchanged
4. **Functionality tests**: Verify all features work as before

## Migration Benefits

1. **Separation of concerns**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Smaller, focused components are easier to debug and modify
4. **Testability**: Individual components can be unit tested in isolation
5. **Performance**: Next.js layout optimizations apply automatically
6. **Developer experience**: Cleaner code organization and better IDE support

## Implementation Order

1. Create layout file with basic structure
2. Extract ChatSidebar component
3. Extract ChatMain component with sub-components
4. Extract individual sub-components (Header, FundSelectors, etc.)
5. Update page.tsx to use layout
6. Update index files for exports
7. Test functionality
8. Refine and optimize

## Notes

- All existing functionality must be preserved
- Maintain TypeScript interfaces for strong typing
- Follow established project conventions
- Keep the same hook patterns but organize them better
- Ensure responsive design works exactly as before
