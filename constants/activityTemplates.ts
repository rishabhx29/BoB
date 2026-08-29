import { ActivitySeed, FieldDefinition } from '@/types';
import { COLORS } from './theme';

export interface ActivityTemplate extends ActivitySeed {
  id: string; // e.g. "gym", "study"
  description: string;
  templateFields: FieldDefinition[];
  fields?: FieldDefinition[];
}

export const PRESET_ACTIVITIES: ActivityTemplate[] = [
  {
    id: 'gym',
    name: 'Gym / Workout',
    description: 'Track your muscle groups, duration, and energy.',
    icon: '🏋️',
    color: '#8B5CF6', // Purple
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: true,
    templateFields: [
      {
        id: 'muscleGroups',
        label: 'Muscle groups trained',
        type: 'multiselect',
        options: ['Chest', 'Back', 'Arms', 'Shoulders', 'Core', 'Legs', 'Cardio', 'Full Body'],
        required: true,
      },
      {
        id: 'duration',
        label: 'Session duration',
        type: 'number',
        unit: 'min',
        required: true,
      },
      {
        id: 'sessionType',
        label: 'Session type',
        type: 'singleselect',
        options: ['Strength', 'Hypertrophy', 'Endurance', 'Mobility', 'CrossFit'],
        required: true,
      },
      {
        id: 'energy',
        label: 'Energy level today',
        type: 'emoji-scale',
        required: false,
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'study',
    name: 'Study Session',
    description: 'Track your study topics and productivity.',
    icon: '📚',
    color: '#3B82F6', // Blue
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'subjects',
        label: 'Subject(s) studied',
        type: 'multiselect',
        options: ['Math', 'CS', 'Physics', 'Chemistry', 'English', 'Other'],
        required: true,
      },
      {
        id: 'duration',
        label: 'Duration',
        type: 'number',
        unit: 'min',
        required: true,
      },
      {
        id: 'topics',
        label: 'Topics covered',
        type: 'text',
        required: true,
      },
      {
        id: 'resource',
        label: 'Resource used',
        type: 'singleselect',
        options: ['Textbook', 'YouTube', 'Notes', 'Online Course', 'Other'],
        required: false,
      },
      {
        id: 'productivity',
        label: 'Productivity rating',
        type: 'stars',
        required: true,
      }
    ]
  },
  {
    id: 'leetcode',
    name: 'LeetCode / DSA',
    description: 'Track coding problems solved and difficulty.',
    icon: '💻',
    color: '#84CC16', // Yellow-green
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'problems',
        label: 'Problems solved',
        type: 'number',
        required: true,
      },
      {
        id: 'difficulty',
        label: 'Difficulty',
        type: 'multiselect',
        options: ['Easy', 'Medium', 'Hard'],
        required: true,
      },
      {
        id: 'topics',
        label: 'Topics covered',
        type: 'multiselect',
        options: ['Arrays', 'Trees', 'DP', 'Graphs', 'Strings', 'Two Pointers', 'Sliding Window', 'Backtracking', 'Other'],
        required: true,
      },
      {
        id: 'problemNames',
        label: 'Problem names/links',
        type: 'text',
        required: false,
      },
      {
        id: 'timeSpent',
        label: 'Time spent',
        type: 'number',
        unit: 'min',
        required: true,
      }
    ]
  },
  {
    id: 'running',
    name: 'Running / Cardio',
    description: 'Track distance, duration, and terrain.',
    icon: '🏃',
    color: '#14B8A6', // Teal
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: true,
    templateFields: [
      {
        id: 'distance',
        label: 'Distance covered',
        type: 'number',
        unit: 'km/mi',
        required: true,
      },
      {
        id: 'duration',
        label: 'Duration',
        type: 'number',
        unit: 'min',
        required: true,
      },
      {
        id: 'terrain',
        label: 'Terrain',
        type: 'singleselect',
        options: ['Road', 'Track', 'Trail', 'Treadmill'],
        required: true,
      },
      {
        id: 'feeling',
        label: 'How did it feel?',
        type: 'emoji-scale',
        required: false,
      },
      {
        id: 'route',
        label: 'Route description',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'reading',
    name: 'Reading',
    description: 'Track pages read and key takeaways.',
    icon: '📖',
    color: '#F59E0B', // Amber
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'title',
        label: 'Book / Article title',
        type: 'text',
        required: true,
      },
      {
        id: 'author',
        label: 'Author',
        type: 'text',
        required: false,
      },
      {
        id: 'pages',
        label: 'Pages read',
        type: 'number',
        required: true,
      },
      {
        id: 'takeaway',
        label: 'Key takeaway',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: 'Track duration, type, and mood changes.',
    icon: '🧘',
    color: '#A78BFA', // Lavender
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'duration',
        label: 'Duration',
        type: 'number',
        unit: 'min',
        required: true,
      },
      {
        id: 'type',
        label: 'Type',
        type: 'singleselect',
        options: ['Guided', 'Breathwork', 'Silent', 'Body Scan', 'Visualization'],
        required: true,
      },
      {
        id: 'moodBefore',
        label: 'Mood before',
        type: 'stars',
        required: true,
      },
      {
        id: 'moodAfter',
        label: 'Mood after',
        type: 'stars',
        required: true,
      },
      {
        id: 'appUsed',
        label: 'App used',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'water',
    name: 'Water Intake',
    description: 'Track daily water consumption.',
    icon: '💧',
    color: '#06B6D4', // Cyan
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'amount',
        label: 'Glasses / liters consumed',
        type: 'number',
        required: true,
      },
      {
        id: 'goalMet',
        label: 'Goal met?',
        type: 'toggle',
        required: true,
      },
      {
        id: 'notes',
        label: 'Notes',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'coldShower',
    name: 'Cold Shower / Ice Bath',
    description: 'Track duration and difficulty.',
    icon: '🌡️',
    color: '#7DD3FC', // Icy Blue
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'duration',
        label: 'Duration',
        type: 'number',
        unit: 'sec/min',
        required: true,
      },
      {
        id: 'temperature',
        label: 'Water temperature',
        type: 'number',
        unit: '°C',
        required: false,
      },
      {
        id: 'difficulty',
        label: 'Difficulty rating today',
        type: 'stars',
        required: true,
      }
    ]
  },
  {
    id: 'language',
    name: 'Language Learning',
    description: 'Track language practice time and skills.',
    icon: '🌍',
    color: '#22C55E', // Green
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    requirePhoto: false,
    templateFields: [
      {
        id: 'language',
        label: 'Language being learned',
        type: 'text',
        required: true,
      },
      {
        id: 'duration',
        label: 'Minutes practiced',
        type: 'number',
        unit: 'min',
        required: true,
      },
      {
        id: 'platform',
        label: 'Platform used',
        type: 'singleselect',
        options: ['Duolingo', 'Anki', 'YouTube', 'Speaking practice', 'Other'],
        required: true,
      },
      {
        id: 'skills',
        label: 'Skill practiced',
        type: 'multiselect',
        options: ['Reading', 'Writing', 'Listening', 'Speaking', 'Vocabulary'],
        required: true,
      }
    ]
  }
];
