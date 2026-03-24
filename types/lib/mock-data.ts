import { ChatMessage, Conversation, EncouragementResponse, FavoriteVerse, Verse } from "@/types";

export const verseOfTheDay: Verse = {
  reference: "Isaiah 41:10",
  text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
};

export const mockEncouragements: EncouragementResponse[] = [
  {
    intro: "I hear you, and I want you to know that what you're feeling is valid. God sees you in this moment and He is near to the brokenhearted.",
    verses: [
      {
        reference: "Psalm 34:18",
        text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
      },
      {
        reference: "Matthew 11:28",
        text: "Come to me, all you who are weary and burdened, and I will give you rest.",
      },
      {
        reference: "Philippians 4:6-7",
        text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      },
    ],
    closing: "Rest in His presence today. He is carrying what you cannot, and His peace is yours for the asking.",
  },
  {
    intro: "It takes courage to share what's on your heart. God already knows your struggles, and He's working all things together for your good.",
    verses: [
      {
        reference: "Romans 8:28",
        text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      },
      {
        reference: "Jeremiah 29:11",
        text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
      },
    ],
    closing: "Keep your eyes on the One who holds your future. He has not forgotten you, and His plans for you are filled with hope.",
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "I've been feeling really anxious about the future lately. Nothing feels certain anymore.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "2",
    role: "assistant",
    content: "",
    encouragement: mockEncouragements[0],
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
  },
  {
    id: "3",
    role: "user",
    content: "Thank you. I really needed to hear that today.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: "4",
    role: "assistant",
    content: "",
    encouragement: mockEncouragements[1],
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    preview: "Feeling anxious about the future",
    lastMessage: "Rest in His presence today...",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "conv-2",
    preview: "Struggling with loneliness",
    lastMessage: "You are never alone...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: "conv-3",
    preview: "Need strength for a hard season",
    lastMessage: "His grace is sufficient...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

export const mockFavorites: FavoriteVerse[] = [
  {
    id: "fav-1",
    reference: "Psalm 23:4",
    text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "fav-2",
    reference: "Proverbs 3:5-6",
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "fav-3",
    reference: "Isaiah 40:31",
    text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export const topicVerses: Record<string, Verse[]> = {
  Love: [
    { reference: "1 Corinthians 13:4-5", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs." },
    { reference: "Romans 8:38-39", text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord." },
    { reference: "1 John 4:19", text: "We love because he first loved us." },
  ],
  Fear: [
    { reference: "2 Timothy 1:7", text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline." },
    { reference: "Psalm 56:3", text: "When I am afraid, I put my trust in you." },
    { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
  ],
  Strength: [
    { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
    { reference: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." },
    { reference: "Psalm 46:1", text: "God is our refuge and strength, an ever-present help in trouble." },
  ],
  Anxiety: [
    { reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." },
    { reference: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you." },
    { reference: "Matthew 6:34", text: "Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own." },
  ],
  Hope: [
    { reference: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit." },
    { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
    { reference: "Hebrews 11:1", text: "Now faith is confidence in what we hope for and assurance about what we do not see." },
  ],
  Faith: [
    { reference: "Hebrews 11:6", text: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him." },
    { reference: "Romans 10:17", text: "Consequently, faith comes from hearing the message, and the message is heard through the word about Christ." },
    { reference: "Mark 11:22-24", text: "Have faith in God. Truly I tell you, if anyone says to this mountain, 'Go, throw yourself into the sea,' and does not doubt in their heart but believes that what they say will happen, it will be done for them." },
  ],
  Purpose: [
    { reference: "Ephesians 2:10", text: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do." },
    { reference: "Proverbs 19:21", text: "Many are the plans in a person's heart, but it is the Lord's purpose that prevails." },
    { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  ],
  Grief: [
    { reference: "Psalm 34:18", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit." },
    { reference: "Revelation 21:4", text: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away." },
    { reference: "Matthew 5:4", text: "Blessed are those who mourn, for they will be comforted." },
  ],
};

export const searchableVerses: Verse[] = Object.values(topicVerses).flat();
