export interface SampleScript {
  id: string;
  title: string;
  category: string;
  speakerId: string;
  style: string;
  text: string;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'algith-doc',
    title: 'Algith - Documentary Narration',
    category: 'Documentary',
    speakerId: 'algith',
    style: 'expressive',
    text: '[Say thoughtfully in a British accent]: Deep within the misty highlands of Scotland, ancient stone circles stand as silent guardians of forgotten secrets. Scholars have debated their celestial alignment for centuries.',
  },
  {
    id: 'sarah-corp',
    title: 'Sarah - Product Announcement',
    category: 'Corporate',
    speakerId: 'sarah',
    style: 'corporate',
    text: 'Welcome to Google AI Studio. Today we are excited to unveil our next-generation Text-to-Speech engine, delivering lifelike vocal synthesis, multi-speaker dialogues, and real-time audio parameters control.',
  },
  {
    id: 'mike-trailer',
    title: 'Mike - Cinematic Movie Trailer',
    category: 'Trailer',
    speakerId: 'mike',
    style: 'dramatic',
    text: '[Say in a deep, booming cinematic voice]: In a world where silence is forbidden, one hero must make their voice heard. Coming to theaters this summer.',
  },
  {
    id: 'puck-game',
    title: 'Puck - Gaming NPC Quest',
    category: 'Gaming',
    speakerId: 'puck',
    style: 'energetic',
    text: '[excitedly]: Hey traveler! Over here! You won\'t believe what just happened in the northern caverns. Grab your sword and follow me!',
  },
  {
    id: 'zephyr-med',
    title: 'Zephyr - Guided Meditation',
    category: 'Meditation',
    speakerId: 'zephyr',
    style: 'calm',
    text: '[whispering softly]: Take a deep breath in... hold it for three seconds... and slowly release. Let go of all tension in your shoulders.',
  },
  {
    id: 'robotic-ai',
    title: 'Cybernetic AI Assistant',
    category: 'Futuristic',
    speakerId: 'kore',
    style: 'robotic',
    text: 'System diagnostic initialized. All subroutines operational. Quantum neural network active. Awaiting voice input parameters.',
  },
];
