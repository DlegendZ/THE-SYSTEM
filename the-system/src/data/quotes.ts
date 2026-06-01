// A large pool of motivational quotes shown on CommandHall, rerolled on every
// app open. Mix of in-world "System" voice (no author) and real-world
// discipline / stoic lines (attributed). Sentence case, on-brand.

export interface Quote {
  text: string;
  author?: string;
}

export const QUOTES: Quote[] = [
  // ── System / Solo-Leveling lore voice ──────────────────────────────────
  { text: 'The weak resent discipline. The strong become it.' },
  { text: 'You were selected because something in you refuses to stay small.' },
  { text: 'Every rank you fear was once climbed by someone who felt exactly as you do now.' },
  { text: 'The System does not reward the almost-disciplined.' },
  { text: 'Arise. The version of you that quits does not get to exist today.' },
  { text: 'Your streak is your sword. Do not set it down.' },
  { text: 'The forge does not close. Neither do you.' },
  { text: 'Power is not given. It is leveled.' },
  { text: 'A monarch is only a survivor who never knelt.' },
  { text: 'The dungeon is your own mind. Clear it daily.' },
  { text: 'Weakness is a debt. Pay it down one trial at a time.' },
  { text: 'You do not rise to the occasion. You fall to your training.' },
  { text: 'The System is watching. So is the man you could become.' },
  { text: 'Today is a gate. Walk through it or wait another day at rank E.' },
  { text: 'Levels are earned in the hours no one claps for.' },
  { text: 'The shadow you run from is the strength you have not claimed.' },
  { text: 'Ascension is just discipline repeated past the point of comfort.' },
  { text: 'Every trial skipped is XP handed to your weakest self.' },
  { text: 'The strongest hunters were the most consistent, not the most gifted.' },
  { text: 'Become someone the old you would have feared.' },
  { text: 'There is no boss harder than the urge to stop.' },
  { text: 'Mana fades. Discipline compounds.' },
  { text: 'Your future self is a higher rank waiting on today.' },
  { text: 'The System tests your resolve. Answer the call.' },
  { text: 'No one is coming to level you up. Good. That power is yours.' },
  { text: 'Hold the line today and tomorrow bows.' },
  { text: '180 days. That is all it takes to become unrecognizable.' },
  { text: 'The covenant is simple: show up, or stay weak.' },
  { text: 'Win the silent war and the loud ones surrender.' },
  { text: 'Rank up the habits and the title follows.' },

  // ── Real-world discipline / grit ───────────────────────────────────────
  { text: 'Discipline equals freedom.', author: 'Jocko Willink' },
  { text: 'You are in danger of living a life so comfortable that you will never realize your true potential.', author: 'David Goggins' },
  { text: 'Motivation is crap. Motivation comes and goes. Discipline is what gets you there.', author: 'David Goggins' },
  { text: 'When you think you are done, you are only at 40 percent.', author: 'David Goggins' },
  { text: 'The only way out is through.', author: 'Robert Frost' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act but a habit.', author: 'Will Durant' },
  { text: 'Suffer the pain of discipline or suffer the pain of regret.', author: 'Jim Rohn' },
  { text: 'Do something today that your future self will thank you for.', author: 'Sean Patrick Flanery' },
  { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
  { text: 'You have power over your mind, not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'That which does not kill us makes us stronger.', author: 'Friedrich Nietzsche' },
  { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
  { text: 'Do not pray for an easy life; pray for the strength to endure a difficult one.', author: 'Bruce Lee' },
  { text: 'I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.', author: 'Bruce Lee' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
  { text: 'Strength does not come from winning. Your struggles develop your strengths.', author: 'Arnold Schwarzenegger' },
  { text: 'Hard choices, easy life. Easy choices, hard life.', author: 'Jerzy Gregorek' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Chinese proverb' },
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'Either you run the day or the day runs you.', author: 'Jim Rohn' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'Knowing is not enough; we must apply. Willing is not enough; we must do.', author: 'Goethe' },
  { text: 'What we fear doing most is usually what we most need to do.', author: 'Tim Ferriss' },
  { text: 'Comfort is the enemy of progress.', author: 'P. T. Barnum' },
  { text: 'If it is important to you, you will find a way. If not, you will find an excuse.', author: 'Ryan Blair' },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { text: 'Lose an hour in the morning, and you will spend all day looking for it.', author: 'Richard Whately' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'Whether you think you can or you think you cannot, you are right.', author: 'Henry Ford' },
  { text: 'Courage is not having the strength to go on; it is going on when you do not have the strength.', author: 'Theodore Roosevelt' },
  { text: 'Nothing in the world can take the place of persistence.', author: 'Calvin Coolidge' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
  { text: 'Do not wish it were easier. Wish you were better.', author: 'Jim Rohn' },
  { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Out of difficulties grow miracles.', author: 'Jean de La Bruyère' },
  { text: 'The harder you work for something, the greater you will feel when you achieve it.' },
  { text: 'Small disciplines repeated with consistency lead to great achievements.', author: 'John Maxwell' },
  { text: 'Your only limit is the amount of doubt you are willing to feed.' },
  { text: 'Excuses are the nails used to build a house of failure.', author: 'Don Wilder' },
  { text: 'Wake up with determination. Go to bed with satisfaction.' },
  { text: 'The cave you fear to enter holds the treasure you seek.', author: 'Joseph Campbell' },
  { text: 'You must do the thing you think you cannot do.', author: 'Eleanor Roosevelt' },
  { text: 'Slow is smooth, and smooth is fast.', author: 'Navy SEALs' },
  { text: 'Train hard, win easy.' },
  { text: 'Sweat now, shine later.' },
  { text: 'Be stronger than your strongest excuse.' },
  { text: 'Consistency is what transforms average into excellence.' },
  { text: 'Win the morning, win the day.', author: 'Tim Ferriss' },
  { text: 'The standard you walk past is the standard you accept.', author: 'David Hurley' },
  { text: 'Pain is temporary. Quitting lasts forever.', author: 'Lance Armstrong' },
  { text: 'You did not come this far to only come this far.' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Greatness is not born. It is forged in the work no one sees.' },
  { text: 'One more rep. One more page. One more day. That is how legends are built.' },
  { text: 'Tough times never last, but tough people do.', author: 'Robert Schuller' },
  { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C. S. Lewis' },
  { text: 'Do the hard things while they are easy, and the great things while they are small.', author: 'Lao Tzu' },
];

let lastIndex = -1;

/** Random quote, avoiding an immediate repeat of the previous pick. */
export function getRandomQuote(): Quote {
  if (QUOTES.length === 1) return QUOTES[0];
  let i = Math.floor(Math.random() * QUOTES.length);
  if (i === lastIndex) i = (i + 1) % QUOTES.length;
  lastIndex = i;
  return QUOTES[i];
}
