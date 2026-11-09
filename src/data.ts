import rooftop from './photos/rooftop.webp'
import charity from './photos/charity.webp'
import tacos from './photos/tacos.webp'
import tailgate from './photos/tailgate.webp'
import arcade from './photos/arcade.webp'
import walking from './photos/walking.webp'
import autumn from './photos/autumn.webp'
import bench from './photos/bench.webp'
import laughing from './photos/laughing.webp'
import toast from './photos/toast.webp'
import venue from './photos/venue.webp'
import grass from './photos/grass.webp'

/* Every photograph is an Unsplash stand-in until Sow has its own event photos.
   Source pages are listed in public/credits.html. */
export const PHOTOS = { rooftop, charity, tacos, tailgate, arcade, walking, autumn, bench, laughing, toast, venue, grass }

export const STATS = [
  { n: 70, unit: '%', t: 'less time with friends for people 15 to 24 than 20 years ago.', f: 1 },
  { n: 5, unit: ' hrs', t: 'a day on social media for the average teen. nearly, anyway.', f: 2 },
  { n: 7, unit: '%', t: 'of time on Instagram goes to posts from your friends. even Meta says so.', f: 3 },
]

export const SOURCES = [
  'U.S. Surgeon General, Our Epidemic of Loneliness and Isolation, 2023 (American Time Use Survey).',
  'Gallup, Teens Spend Average of 4.8 Hours on Social Media Per Day, 2023.',
  'Meta court filing in FTC v. Meta, 2025.',
]

export const STICKERS = ['99+', '3:47 am', '"just one more scroll"']

export const STEPS = [
  { t: 'pick a night', b: 'one tap to RSVP.', photo: toast },
  { t: 'get a crew', b: 'coming solo? we put you in a crew of 3 to 6 who share something with you.', photo: autumn },
  { t: 'meet up first', b: 'meet at a public spot, then walk in together.', photo: walking },
  { t: 'come back', b: 'same crew if you want. every night earns you a decal.', photo: laughing },
]

export const RULES = [
  'students only. verified with your school email.',
  'crews meet in public. always.',
  'women-only crews if you want them.',
  'report and block, no questions asked.',
  'same cup for everyone. drink whatever you want.',
  'no filming you without your OK. grab a no-film sticker at the door.',
]

export type SowEvent = { id: number; day: string; date: string; month: string; dow: string; title: string; body: string; photo: string; color: string }
export const EVENTS: SowEvent[] = [
  { id: 1, day: 'Sat', dow: 'Saturday', date: '14', month: 'Nov', title: 'rooftop party', body: "a rooftop, good music, and people you haven't met yet.", photo: rooftop, color: 'pink' },
  { id: 2, day: 'Sun', dow: 'Sunday', date: '15', month: 'Nov', title: 'charity event', body: 'give back for an afternoon and meet people doing the same.', photo: charity, color: 'green' },
  { id: 3, day: 'Tue', dow: 'Tuesday', date: '17', month: 'Nov', title: "taco tuesday at kip's", body: 'tacos, a crew, and a table waiting for you.', photo: tacos, color: 'orange' },
  { id: 4, day: 'Sat', dow: 'Saturday', date: '21', month: 'Nov', title: 'big game tailgate', body: "before the game, with people you'll actually like.", photo: tailgate, color: 'blue' },
]
export const TRUCK = { title: 'the game truck', body: "something with a lot of screens is rolling onto campus. that's all we can say.", photo: arcade }

export const REACTIONS = ['🙋', '🎉', '🔥', '👀']

export const VENUE_POINTS = [
  ['we bring the crowd', "students who signed up, RSVP'd, and checked in at the door."],
  ['you pick the night', "tell us when it's quiet and we'll fill it."],
  ['you get the numbers', 'how many came, when, and how many came back.'],
]

export const FAQ: [string, string][] = [
  ['why do I need a .edu email?', 'Sow Social opens one campus at a time, and your school email puts you on the right one. It also means everyone you meet is actually a student.'],
  ['do i have to play?', 'nope. half the room is just hanging out.'],
  ['can i come alone?', "that's the point."],
  ['is this a school thing?', 'no. Sow Social is not affiliated with UC Berkeley.'],
  ['how do I move up the list?', 'Share your invite link, find the daily spot in Bearings, and come to the events.'],
  ['when does it open?', 'Berkeley gets it first. People on the waitlist hear before anyone else.'],
]

export const SPOTS = ['the big lawn', 'library steps', 'the fountain', 'clock tower', 'north gate', 'the creek', 'student union', 'the stadium', 'telegraph ave']
export const TODAY = Math.floor(Date.now() / 86400000) % SPOTS.length
export const MAX_GUESSES = 3
