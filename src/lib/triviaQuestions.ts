export type TriviaCategory = 'anime' | 'gaming' | 'filipino' | 'general';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // ANIME (15)
  {
    id: "a1", category: "anime", difficulty: "easy",
    question: "In Attack on Titan, what is Eren Yeager's Titan ability?",
    options: ["Attack Titan", "Colossal Titan", "Armored Titan", "Female Titan"],
    correctIndex: 0
  },
  {
    id: "a2", category: "anime", difficulty: "medium",
    question: "How many episodes does Frieren: Beyond Journey's End have?",
    options: ["16", "20", "28", "32"],
    correctIndex: 2
  },
  {
    id: "a3", category: "anime", difficulty: "easy",
    question: "Who is the protagonist of Naruto?",
    options: ["Sasuke Uchiha", "Naruto Uzumaki", "Kakashi Hatake", "Jiraiya"],
    correctIndex: 1
  },
  {
    id: "a4", category: "anime", difficulty: "easy",
    question: "In Death Note, what is the true name of L?",
    options: ["Light Yagami", "L Lawliet", "Nate River", "Mihael Keehl"],
    correctIndex: 1
  },
  {
    id: "a5", category: "anime", difficulty: "medium",
    question: "What is the highest bounty currently in One Piece?",
    options: ["Gol D. Roger", "Whitebeard", "Kaido", "Shanks"],
    correctIndex: 0
  },
  {
    id: "a6", category: "anime", difficulty: "easy",
    question: "Which anime features the Elric brothers?",
    options: ["Bleach", "Fullmetal Alchemist", "Fairy Tail", "My Hero Academia"],
    correctIndex: 1
  },
  {
    id: "a7", category: "anime", difficulty: "medium",
    question: "In Demon Slayer, who is the Sound Hashira?",
    options: ["Giyu Tomioka", "Kyojuro Rengoku", "Tengen Uzui", "Muichiro Tokito"],
    correctIndex: 2
  },
  {
    id: "a8", category: "anime", difficulty: "hard",
    question: "In Steins;Gate, what is the name of Okabe Rintarou's organization?",
    options: ["SERN", "Future Gadget Laboratory", "Rounders", "Valkyrie"],
    correctIndex: 1
  },
  {
    id: "a9", category: "anime", difficulty: "easy",
    question: "What anime focuses on hunting down monsters called 'Hollows'?",
    options: ["Naruto", "Dragon Ball", "Bleach", "Tokyo Ghoul"],
    correctIndex: 2
  },
  {
    id: "a10", category: "anime", difficulty: "medium",
    question: "Which character in Jujutsu Kaisen uses 'Limitless' and 'Six Eyes'?",
    options: ["Yuji Itadori", "Megumi Fushiguro", "Satoru Gojo", "Kento Nanami"],
    correctIndex: 2
  },
  {
    id: "a11", category: "anime", difficulty: "medium",
    question: "In Hunter x Hunter, what is Killua's Nen type?",
    options: ["Enhancer", "Transmuter", "Emitter", "Conjurer"],
    correctIndex: 1
  },
  {
    id: "a12", category: "anime", difficulty: "easy",
    question: "Who is the creator of Dragon Ball?",
    options: ["Masashi Kishimoto", "Eiichiro Oda", "Akira Toriyama", "Tite Kubo"],
    correctIndex: 2
  },
  {
    id: "a13", category: "anime", difficulty: "hard",
    question: "In Code Geass, what is the real identity of Zero?",
    options: ["Suzaku Kururugi", "Lelouch vi Britannia", "C.C.", "Schneizel el Britannia"],
    correctIndex: 1
  },
  {
    id: "a14", category: "anime", difficulty: "medium",
    question: "What is the name of the VR game in Sword Art Online?",
    options: ["ALfheim Online", "Gun Gale Online", "Sword Art Online", "Underworld"],
    correctIndex: 2
  },
  {
    id: "a15", category: "anime", difficulty: "easy",
    question: "In My Hero Academia, what is Izuku Midoriya's quirk called?",
    options: ["Half-Cold Half-Hot", "Explosion", "One For All", "Zero Gravity"],
    correctIndex: 2
  },

  // GAMING (15)
  {
    id: "g1", category: "gaming", difficulty: "easy",
    question: "What year was Minecraft first released?",
    options: ["2009", "2010", "2011", "2012"],
    correctIndex: 0
  },
  {
    id: "g2", category: "gaming", difficulty: "easy",
    question: "In Mobile Legends, which hero is known as 'The Lightborn'?",
    options: ["Estes", "Rafaela", "Angela", "Lesley"],
    correctIndex: 0
  },
  {
    id: "g3", category: "gaming", difficulty: "medium",
    question: "What is the highest rank in Valorant?",
    options: ["Radiant", "Immortal", "Diamond", "Challenger"],
    correctIndex: 0
  },
  {
    id: "g4", category: "gaming", difficulty: "easy",
    question: "Which game features the characters Mario and Luigi?",
    options: ["Sonic the Hedgehog", "Super Mario Bros.", "Legend of Zelda", "Donkey Kong"],
    correctIndex: 1
  },
  {
    id: "g5", category: "gaming", difficulty: "medium",
    question: "In League of Legends, what is the name of the main map?",
    options: ["Twisted Treeline", "Howling Abyss", "Summoner's Rift", "Crystal Scar"],
    correctIndex: 2
  },
  {
    id: "g6", category: "gaming", difficulty: "hard",
    question: "What was the first video game to be played in space?",
    options: ["Tetris", "Pong", "Space Invaders", "Pac-Man"],
    correctIndex: 0
  },
  {
    id: "g7", category: "gaming", difficulty: "easy",
    question: "Who is the main protagonist of the Legend of Zelda series?",
    options: ["Zelda", "Ganondorf", "Link", "Impa"],
    correctIndex: 2
  },
  {
    id: "g8", category: "gaming", difficulty: "medium",
    question: "In Genshin Impact, what is the element of the Raiden Shogun?",
    options: ["Anemo", "Geo", "Electro", "Pyro"],
    correctIndex: 2
  },
  {
    id: "g9", category: "gaming", difficulty: "easy",
    question: "What is the best-selling video game console of all time?",
    options: ["PlayStation 2", "Nintendo DS", "Nintendo Switch", "PlayStation 4"],
    correctIndex: 0
  },
  {
    id: "g10", category: "gaming", difficulty: "medium",
    question: "Which game popularized the battle royale genre in 2017?",
    options: ["Fortnite", "PUBG", "Apex Legends", "Call of Duty: Warzone"],
    correctIndex: 1
  },
  {
    id: "g11", category: "gaming", difficulty: "hard",
    question: "In Dark Souls, what is the name of the final boss?",
    options: ["Gwyn, Lord of Cinder", "Artorias the Abysswalker", "Soul of Cinder", "Nameless King"],
    correctIndex: 0
  },
  {
    id: "g12", category: "gaming", difficulty: "medium",
    question: "What does 'NPC' stand for?",
    options: ["Non-Player Character", "New Player Character", "Next Phase Combat", "No Point Continuing"],
    correctIndex: 0
  },
  {
    id: "g13", category: "gaming", difficulty: "easy",
    question: "Which company created the Xbox?",
    options: ["Sony", "Nintendo", "Microsoft", "Sega"],
    correctIndex: 2
  },
  {
    id: "g14", category: "gaming", difficulty: "medium",
    question: "In Overwatch, what is Tracer's real name?",
    options: ["Lena Oxton", "Amélie Lacroix", "Angela Ziegler", "Hana Song"],
    correctIndex: 0
  },
  {
    id: "g15", category: "gaming", difficulty: "hard",
    question: "What was the original name of the Nintendo company when it was founded in 1889?",
    options: ["Nintendo Koppai", "Nintendo Entertainment", "Nintendo Games", "Nintendo Cards"],
    correctIndex: 0
  },

  // FILIPINO (15)
  {
    id: "f1", category: "filipino", difficulty: "easy",
    question: "What is the national hero of the Philippines?",
    options: ["Andres Bonifacio", "Jose Rizal", "Emilio Aguinaldo", "Lapu-Lapu"],
    correctIndex: 1
  },
  {
    id: "f2", category: "filipino", difficulty: "medium",
    question: "What Filipino word means 'community spirit'?",
    options: ["Bayanihan", "Utang na loob", "Hiya", "Pakikisama"],
    correctIndex: 0
  },
  {
    id: "f3", category: "filipino", difficulty: "easy",
    question: "What is the capital city of the Philippines?",
    options: ["Cebu", "Davao", "Manila", "Quezon City"],
    correctIndex: 2
  },
  {
    id: "f4", category: "filipino", difficulty: "easy",
    question: "Which popular Filipino dish is considered the unofficial national dish?",
    options: ["Sinigang", "Adobo", "Lechon", "Kare-kare"],
    correctIndex: 1
  },
  {
    id: "f5", category: "filipino", difficulty: "medium",
    question: "What is the longest river in the Philippines?",
    options: ["Pasig River", "Cagayan River", "Agusan River", "Pampanga River"],
    correctIndex: 1
  },
  {
    id: "f6", category: "filipino", difficulty: "hard",
    question: "Who was the first President of the Philippine Republic?",
    options: ["Manuel L. Quezon", "Emilio Aguinaldo", "Apolinario Mabini", "Jose P. Laurel"],
    correctIndex: 1
  },
  {
    id: "f7", category: "filipino", difficulty: "medium",
    question: "What is the name of the active volcano located in Albay known for its perfect cone shape?",
    options: ["Taal Volcano", "Mount Pinatubo", "Mount Apo", "Mayon Volcano"],
    correctIndex: 3
  },
  {
    id: "f8", category: "filipino", difficulty: "easy",
    question: "What is the primary ingredient of 'Balut'?",
    options: ["Chicken egg", "Duck egg", "Quail egg", "Ostrich egg"],
    correctIndex: 1
  },
  {
    id: "f9", category: "filipino", difficulty: "medium",
    question: "In what year did the Philippines gain independence from Spain?",
    options: ["1896", "1898", "1946", "1521"],
    correctIndex: 1
  },
  {
    id: "f10", category: "filipino", difficulty: "hard",
    question: "What is the indigenous script used in the Philippines before Spanish colonization?",
    options: ["Alibata", "Baybayin", "Kawi", "Hanunoo"],
    correctIndex: 1
  },
  {
    id: "f11", category: "filipino", difficulty: "easy",
    question: "Which fast-food chain is known for its 'Chickenjoy'?",
    options: ["McDonald's", "KFC", "Jollibee", "Chowking"],
    correctIndex: 2
  },
  {
    id: "f12", category: "filipino", difficulty: "medium",
    question: "What is the highest mountain in the Philippines?",
    options: ["Mount Pulag", "Mount Apo", "Mount Halcon", "Mount Banahaw"],
    correctIndex: 1
  },
  {
    id: "f13", category: "filipino", difficulty: "hard",
    question: "Who wrote 'Florante at Laura'?",
    options: ["Jose Rizal", "Francisco Balagtas", "Graciano Lopez Jaena", "Marcelo H. del Pilar"],
    correctIndex: 1
  },
  {
    id: "f14", category: "filipino", difficulty: "medium",
    question: "What currency is used in the Philippines?",
    options: ["Dollar", "Yen", "Baht", "Peso"],
    correctIndex: 3
  },
  {
    id: "f15", category: "filipino", difficulty: "easy",
    question: "What vehicle is known as the 'King of the Road' in the Philippines?",
    options: ["Tricycle", "Jeepney", "Bus", "Kalesa"],
    correctIndex: 1
  },

  // GENERAL (15)
  {
    id: "gen1", category: "general", difficulty: "easy",
    question: "How many planets are in our solar system?",
    options: ["7", "8", "9", "10"],
    correctIndex: 1
  },
  {
    id: "gen2", category: "general", difficulty: "medium",
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctIndex: 2
  },
  {
    id: "gen3", category: "general", difficulty: "easy",
    question: "Which ocean is the largest on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctIndex: 3
  },
  {
    id: "gen4", category: "general", difficulty: "medium",
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
    correctIndex: 2
  },
  {
    id: "gen5", category: "general", difficulty: "hard",
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctIndex: 2
  },
  {
    id: "gen6", category: "general", difficulty: "easy",
    question: "What is the main language spoken in Brazil?",
    options: ["Spanish", "Portuguese", "English", "French"],
    correctIndex: 1
  },
  {
    id: "gen7", category: "general", difficulty: "medium",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1
  },
  {
    id: "gen8", category: "general", difficulty: "hard",
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
    correctIndex: 1
  },
  {
    id: "gen9", category: "general", difficulty: "easy",
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correctIndex: 2
  },
  {
    id: "gen10", category: "general", difficulty: "medium",
    question: "What is the largest mammal in the world?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Shark"],
    correctIndex: 1
  },
  {
    id: "gen11", category: "general", difficulty: "hard",
    question: "In what year did the Titanic sink?",
    options: ["1905", "1912", "1918", "1923"],
    correctIndex: 1
  },
  {
    id: "gen12", category: "general", difficulty: "easy",
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2
  },
  {
    id: "gen13", category: "general", difficulty: "medium",
    question: "What is the square root of 144?",
    options: ["10", "12", "14", "16"],
    correctIndex: 1
  },
  {
    id: "gen14", category: "general", difficulty: "hard",
    question: "What element does 'O' represent on the periodic table?",
    options: ["Osmium", "Oxygen", "Oganesson", "Ozone"],
    correctIndex: 1
  },
  {
    id: "gen15", category: "general", difficulty: "easy",
    question: "Which color is NOT in a rainbow?",
    options: ["Red", "Blue", "Pink", "Yellow"],
    correctIndex: 2
  }
];
