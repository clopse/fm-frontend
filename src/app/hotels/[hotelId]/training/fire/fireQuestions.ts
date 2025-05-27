export interface FireQuestion {
  question: string;
  options: string[];
  correct: number[]; // Indexes of correct answers
  image?: string;
}

const fireQuestions: FireQuestion[] = [
  {
    question: "The fire alarm sounds during the middle shift. Nayara (Coordinator) is on break. What should happen?",
    options: [
      "If short-staffed, hand a guest/guests exit organiser cards and briefly explain to them their job",
      "Everyone shifts up one role. Each person takes the next position in the list.",
      "Wait until Nayara returns.",
      "Decide who should be coordinator in the moment."
    ],
    correct: [0, 1],
    image: "/training/roles.png"
  },
  {
    question: "What does the red light on the fire panel indicate?",
    options: [
      "Fire detected in the building.",
      "System test in progress.",
      "Power failure.",
      "Device disconnected."
    ],
    correct: [0],
    image: "/training/firepanel.png"
  },
  {
    question: "When should you use a fire extinguisher?",
    options: [
      "Only if the fire is small and you are trained.",
      "Anytime you see smoke.",
      "To silence the alarm.",
      "To prop open doors."
    ],
    correct: [0],
    image: "/training/extinguishertypes.png"
  },
  {
    question: "What should be handed to the fire brigade on arrival?",
    options: [
      "Guest list",
      "Fire keys", 
      "Floor plans",
      "PEEP form"
    ],
    correct: [0, 1, 2, 3]
  },
  {
    question: "Where are the fire keys kept?",
    options: [
      "In the fire box",
      "With the manager", 
      "In the key box",
      "On the DM keys"
    ],
    correct: [2],
  },
  {
    question: "What is the purpose of the emergency door release?",
    options: [
      "Unlocks secure doors during a fire.",
      "Triggers the fire alarm.",
      "Silences the alarm.", 
      "Calls emergency services."
    ],
    correct: [0],
    image: "/training/emergencydoorrelease.png"
  },
  {
    question: "What is a PEEP and why is it important?",
    options: [
      "A personal emergency evacuation plan for guests with mobility needs.",
      "A new staff training course.",
      "The keycode for the fire panel.",
      "Guest meal preferences."
    ],
    correct: [0],
  },
  {
    question: "When should the guest list be updated?",
    options: [
      "Once per week.",
      "Every 2 hours.",
      "Only after check-in.",
      "Once a day."
    ],
    correct: [1]
  },
  {
    question: "Where do all guests and staff gather during a fire evacuation?",
    options: [
      "At the designated assembly point at the Gresham Hotel.",
      "In the hotel lobby.",
      "In the car park.",
      "Wherever is convenient."
    ],
    correct: [0],
    image: "/training/assembly-point.png"
  },
  {
    question: "What should you do if you see a fire and the alarm hasn't sounded yet?",
    options: [
      "Activate the nearest manual call point.",
      "Ignore it until the alarm sounds.",
      "Find your manager.",
      "Call 999 from your mobile."
    ],
    correct: [0],
    image: "/training/mcp.png"
  }
];

export default fireQuestions;
