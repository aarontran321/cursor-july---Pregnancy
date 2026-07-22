// localStorage-backed store, ported from the Vite prototype.
// Shaped so a real backend can drop in later.

export type RoleId = 'spouseA' | 'spouseB' | 'guest'

export interface Role {
  id: RoleId
  label: string
  kind: 'spouse' | 'guest'
  emoji: string
}

export interface EmailMsg {
  id: string
  from: 'spouse' | 'vendor'
  sender: string
  time: string
  body: string
}

export interface Option {
  id: string
  albumId: string
  title: string
  subtitle: string
  price: string
  imageUrl: string
  gradient: string
  status: 'approved' | 'pending'
  likes: { spouseA: boolean; spouseB: boolean }
  addedBy: RoleId
  createdAt: number
  email?: string
  subject?: string
  thread?: EmailMsg[]
}

export interface Album {
  id: string
  name: string
  emoji: string
}

export interface Notif {
  id: string
  text: string
  emoji: string
  read: boolean
  createdAt: number
}

export interface State {
  albums: Album[]
  options: Option[]
  notifications: Notif[]
}

const KEY = 'marrymap:v2'

export const ROLES: Record<RoleId, Role> = {
  spouseA: { id: 'spouseA', label: 'Alex', kind: 'spouse', emoji: '💛' },
  spouseB: { id: 'spouseB', label: 'Sam', kind: 'spouse', emoji: '💙' },
  guest: { id: 'guest', label: 'Guest', kind: 'guest', emoji: '🎁' },
}

export const uid = () => Math.random().toString(36).slice(2, 9)

// gradient placeholder so the demo never depends on external images loading
const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`

function seed(): State {
  const albums: Album[] = [
    { id: 'catering', name: 'Catering', emoji: '🍽️' },
    { id: 'dj', name: 'DJ / Music', emoji: '🎧' },
    { id: 'photographer', name: 'Photographer', emoji: '📸' },
    { id: 'venue', name: 'Venue', emoji: '🏛️' },
    { id: 'florist', name: 'Florist', emoji: '💐' },
    { id: 'cake', name: 'Cake', emoji: '🎂' },
  ]

  const mk = (
    albumId: string,
    title: string,
    subtitle: string,
    price: string,
    colors: [string, string],
    extra: Partial<Option> = {}
  ): Option => ({
    id: uid(),
    albumId,
    title,
    subtitle,
    price,
    imageUrl: '',
    gradient: grad(colors[0], colors[1]),
    status: 'approved',
    likes: { spouseA: false, spouseB: false },
    addedBy: 'spouseA',
    createdAt: Date.now(),
    ...extra,
  })

  const options: Option[] = [
    mk('catering', 'Olive & Vine', 'Farm-to-table, 3 courses', '$95 / head', ['#f6a', '#f60']),
    mk('catering', 'Saffron Table', 'Modern Indian, family style', '$78 / head', ['#fa0', '#f50']),
    mk('catering', 'Coastal Spread', 'Seafood + raw bar', '$120 / head', ['#0cf', '#06f']),

    mk('dj', 'DJ Mercury', 'Open-format, 2 assistants', '$1,800', ['#a0f', '#40f']),
    mk('dj', 'The Vinyl Bros', 'Live band + DJ combo', '$3,200', ['#f0a', '#a04']),
    mk('dj', 'Neon Nights', 'EDM / Top 40 specialist', '$1,400', ['#0ff', '#08f']),
    mk('dj', 'DJ Chelo Santiago', 'Open-format · Latin & throwbacks', '$2,400', ['#f43', '#a11'], {
      email: 'chelo@chelosantiagosounds.com',
      subject: 'Wedding DJ — quote request',
      thread: [
        {
          id: uid(),
          from: 'spouse',
          sender: 'Alex',
          time: 'Jul 14, 9:12 AM',
          body: "Hi Chelo! We're Alex & Sam — getting married this fall and we loved your set at the Reyes wedding. Are you available our date, and roughly what would a quote look like?",
        },
        {
          id: uid(),
          from: 'vendor',
          sender: 'Chelo Santiago',
          time: 'Jul 14, 4:38 PM',
          body: "Hi Alex & Sam — congratulations! 🎉 I'd love to be part of your day. To put together an accurate quote, could you share a few details: your date, venue, guest count, how many hours of coverage you need, and the vibe you're going for?",
        },
        {
          id: uid(),
          from: 'spouse',
          sender: 'Sam',
          time: 'Jul 15, 8:02 AM',
          body: "Of course! Here's everything:\n• Date: Saturday, September 19, 2026\n• Venue: The Glasshouse Botanical Garden, Portland OR\n• Guests: about 140\n• Reception: 6:00–11:00 PM (5 hours)\n• Vibe: open-format — a little salsa & bachata for our families, plus 90s/2000s throwbacks and current Top 40.",
        },
        {
          id: uid(),
          from: 'vendor',
          sender: 'Chelo Santiago',
          time: 'Jul 15, 1:15 PM',
          body: "Perfect, that helps a lot. For 5 hours at The Glasshouse with ~140 guests, my package is $2,400 — premium sound, dance-floor lighting, a wireless mic for toasts, and an online planner to build your must-play / do-not-play lists. Two quick questions: do you also need ceremony audio, and about what time is the grand entrance?",
        },
        {
          id: uid(),
          from: 'spouse',
          sender: 'Alex',
          time: 'Jul 15, 6:47 PM',
          body: "Love it. Yes to ceremony audio — short and outdoors, around 4:00 PM — and the grand entrance will be about 6:30. What do you need to lock in the date?",
        },
        {
          id: uid(),
          from: 'vendor',
          sender: 'Chelo Santiago',
          time: 'Jul 16, 10:05 AM',
          body: "Great choices. Ceremony audio is a simple $250 add-on. To hold September 19 I just need a signed agreement and a 25% deposit ($660). I'll send the contract over today — can't wait to throw a great party for you both!",
        },
      ],
    }),

    mk('photographer', 'Luma Studio', 'Editorial, film + digital', '$4,500', ['#fd0', '#f80'], {
      likes: { spouseA: true, spouseB: true }, // a match out of the gate
    }),
    mk('photographer', 'Rowan Fields', 'Candid documentary style', '$3,100', ['#7c5', '#293']),
    mk('photographer', 'Amara Lens', 'Bright & airy, drone add-on', '$2,900', ['#fbc', '#f69']),

    mk('venue', 'The Glasshouse', 'Botanical garden, 180 cap', '$9,000', ['#3d8', '#085']),
    mk('venue', 'Ironworks Loft', 'Industrial downtown, 120 cap', '$6,500', ['#89a', '#456']),

    mk('florist', 'Wildbloom', 'Seasonal, foraged look', '$2,200', ['#f9b', '#e37']),
    mk('cake', 'Sugar & Salt', 'Naked cake, 4 tiers', '$650', ['#fda', '#f97']),
  ]

  // a guest idea is auto-accepted straight into the album for the couple to swipe
  options.push(
    mk('dj', 'Sunset Soundsystem', 'Added by Aunt Rosa', '$2,000', ['#f70', '#f07'], {
      status: 'approved',
      addedBy: 'guest',
    })
  )

  const notifications: Notif[] = [
    { id: uid(), text: 'Aunt Rosa joined the board', emoji: '🎉', read: false, createdAt: Date.now() - 6e4 },
    { id: uid(), text: 'Jordan (best man) joined the board', emoji: '🎉', read: false, createdAt: Date.now() - 12e5 },
  ]

  return { albums, options, notifications }
}

// names used to simulate a guest accepting the invite
export const GUEST_NAMES = [
  'Maya', 'Uncle Dev', 'Priya', 'Grandma Lee', 'Chris', 'Nina', 'Theo', 'Aunt Bea',
]

export function load(): State {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>
      if (!Array.isArray(s.albums) || !Array.isArray(s.options)) return reseed()
      if (!Array.isArray(s.notifications)) s.notifications = seed().notifications
      return s as State
    }
  } catch {}
  return reseed()
}

function reseed(): State {
  const fresh = seed()
  save(fresh)
  return fresh
}

export function save(state: State) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetAll() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export const isMatch = (o: Option) => o.likes.spouseA && o.likes.spouseB
