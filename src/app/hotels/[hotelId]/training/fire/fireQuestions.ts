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
      "Assign someone verbally in the moment."
    ],
    correct: [0, 1],
    image: "/training/roles-printout.png"
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
    image: "/training/fire-panel.png"
  },
  {
    question: "When should you use a fire extinguisher?",
    options: [
      "Only if the fire is small and you are trained.",
      "Anytime you see smoke.",
      "To silence the alarm.",
      "To open emergency exits."
    ],
    correct: [0],
    image: "/training/extinguishers.png"
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
      "Inside the lift"
    ],
    correct: [2],
    image: "/training/fire-keys.png"
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
    image: "/training/emergency-door-release.png"
  },
  {
    question: "What is a PEEP?",
    options: [
      "A personal emergency evacuation plan for guests with mobility needs.",
      "A new staff training course.",
      "The keycode for the fire panel.",
      "Guest meal preferences."
    ],
    correct: [0]
  },
  {
    question: "When should the guest list be updated?",
    options: [
      "Once per week.",
      "Every shift (recommended every 2 hours).",
      "Only after check-in.",
      "Once a day."
    ],
    correct: [1]
  },
  {
    question: "What does the amber light on the fire panel mean?",
    options: [
      "A fault or issue in the system.",
      "A drill is starting.",
      "There’s a fire.",
      "The system is off."
    ],
    correct: [0]
  },
  {
    question: "What should you do if you see a fire and the alarm hasn’t sounded yet?",
    options: [
      "Activate the nearest manual call point.",
      "Ignore it until the alarm sounds.",
      "Find your manager.",
      "Call 999 from your mobile."
    ],
    correct: [0],
    image: "/training/manual-call-point.png"
  }
];

export default fireQuestions;
