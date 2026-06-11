export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  cost: number;
}

export const STICKERS: Sticker[] = [
  // Animals (Existing + New)
  { id: 's1', emoji: '🐼', name: 'Panda', cost: 50 },
  { id: 's2', emoji: '🦁', name: 'Lion', cost: 60 },
  { id: 's3', emoji: '🐯', name: 'Tiger', cost: 70 },
  { id: 's4', emoji: '🦒', name: 'Giraffe', cost: 80 },
  { id: 's5', emoji: '🦊', name: 'Fox', cost: 90 },
  { id: 's6', emoji: '🐵', name: 'Monkey', cost: 100 },
  { id: 's7', emoji: '🐸', name: 'Frog', cost: 110 },
  { id: 's8', emoji: '🐰', name: 'Rabbit', cost: 120 },
  { id: 's14', emoji: '🐙', name: 'Octopus', cost: 140 },
  { id: 's15', emoji: '🦋', name: 'Butterfly', cost: 100 },
  { id: 's16', emoji: '🐘', name: 'Elephant', cost: 150 },
  { id: 's17', emoji: '🐧', name: 'Penguin', cost: 130 },
  { id: 's18', emoji: '🦉', name: 'Owl', cost: 160 },
  { id: 's19', emoji: '🐢', name: 'Turtle', cost: 140 },
  { id: 's20', emoji: '🐳', name: 'Whale', cost: 200 },
  { id: 's21', emoji: '🐝', name: 'Bee', cost: 80 },
  { id: 's22', emoji: '🐞', name: 'Ladybug', cost: 90 },
  { id: 's23', emoji: '🦜', name: 'Parrot', cost: 170 },
  { id: 's24', emoji: '🦥', name: 'Sloth', cost: 180 },
  { id: 's25', emoji: '🐨', name: 'Koala', cost: 190 },

  // Fantasy & Magic
  { id: 's9', emoji: '🦄', name: 'Unicorn', cost: 250 },
  { id: 's10', emoji: '🐉', name: 'Dragon', cost: 300 },
  { id: 's26', emoji: '🧚', name: 'Fairy', cost: 280 },
  { id: 's27', emoji: '🧜', name: 'Mermaid', cost: 320 },
  { id: 's28', emoji: '🧙', name: 'Wizard', cost: 350 },
  { id: 's29', emoji: '🏰', name: 'Castle', cost: 400 },
  { id: 's30', emoji: '🌈', name: 'Rainbow', cost: 220 },

  // Space & Adventure
  { id: 's11', emoji: '🚀', name: 'Rocket', cost: 150 },
  { id: 's12', emoji: '🛸', name: 'UFO', cost: 300 },
  { id: 's31', emoji: '👨‍🚀', name: 'Astronaut', cost: 260 },
  { id: 's32', emoji: '🪐', name: 'Saturn', cost: 240 },
  { id: 's33', emoji: '☄️', name: 'Comet', cost: 210 },
  { id: 's34', emoji: '🏴‍☠️', name: 'Pirate', cost: 270 },
  { id: 's35', emoji: '⚓', name: 'Anchor', cost: 180 },

  // Dino World
  { id: 's13', emoji: '🦖', name: 'T-Rex', cost: 180 },
  { id: 's36', emoji: '🦕', name: 'Brachio', cost: 190 },
  { id: 's37', emoji: '🌋', name: 'Volcano', cost: 230 },
  { id: 's38', emoji: '🦴', name: 'Fossil', cost: 160 },

  // Nature & Weather
  { id: 's39', emoji: '🌻', name: 'Flower', cost: 100 },
  { id: 's40', emoji: '🍄', name: 'Mushroom', cost: 110 },
  { id: 's41', emoji: '🌵', name: 'Cactus', cost: 120 },
  { id: 's42', emoji: '❄️', name: 'Snowflake', cost: 140 },
  { id: 's43', emoji: '🔥', name: 'Fire', cost: 150 },
  { id: 's44', emoji: '💎', name: 'Diamond', cost: 500 },
];
