
```
src/
├── core/                  
│   ├── config.ts          
│   └── logger.ts          
├── db/                    
│   ├── sqlite.ts          
│   └── semantic-store.ts  
├── agent/                 
│   ├── graph.ts           
│   ├── state.ts           
│   ├── schemas.ts         
│   └── nodes/             
│       ├── chat.ts
│       └── extractor.ts
├── types/                 
│   └── index.ts           
└── index.ts
```

```ini
session-flow/
│
├── src/
│   ├── index.ts            // CLI
│   ├── graph.ts            // graph wiring
│   ├── state.ts            // Annotation.Root
│   ├── config.ts
│   │
│   ├── nodes/
│   │   ├── chat.ts
│   │   └── extractor.ts
│   │
│   ├── memory/
│   │   ├── semantic-store.ts
│   │   └── checkpointer.ts
│   │
│   ├── schemas.ts
│   ├── llm.ts
│   └── types.ts
│
├── sessionflow.db
└── package.json
```

```
src/
├── index.ts                 # Entry point (CLI)
├── config.ts                # App config + env
├── llm.ts                   # Gemini client
├── graph.ts                 # Build & compile graph
├── state.ts                 # LangGraph state (Annotation.Root)
├── schemas.ts               # Zod schemas for structured output
│
├── nodes/
│   ├── chat.ts
│   └── extractor.ts
│
├── memory/
│   ├── semantic-store.ts    # Append-only SQLite store
│   └── checkpointer.ts      # Thread persistence
│
├── types/
│   └── memory.ts            # TS types (optional)
│
└── utils/
    └── prompts.ts           # System prompts
```